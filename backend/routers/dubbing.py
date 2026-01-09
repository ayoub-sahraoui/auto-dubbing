"""API routes for dubbing workflow."""
import uuid
import json
import logging
import time
from pathlib import Path
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from config import (
    UPLOADS_DIR, OUTPUTS_DIR, ALLOWED_VIDEO_EXTENSIONS,
    MAX_UPLOAD_SIZE, SUPPORTED_VOICES, WHISPER_MODEL
)
from models.schemas import (
    JobStatus, JobResponse, UploadResponse, TranscribeRequest,
    GenerateVoiceRequest, TranscriptResponse, TranscriptSegment,
    TranscriptUpdateRequest, LanguagesResponse, LanguageOption, VoiceOption
)
from services.transcription import TranscriptionService
from services.tts import TTSService
from services.video import VideoService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["dubbing"])

# In-memory job storage (use Redis/DB in production)
jobs: dict = {}


def get_job(job_id: str) -> dict:
    """Get job by ID or raise 404."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


def update_job(job_id: str, **kwargs):
    """Update job fields."""
    if job_id in jobs:
        jobs[job_id].update(kwargs)
        jobs[job_id]["updated_at"] = datetime.utcnow()


def save_jobs_state():
    """Persist jobs to file for recovery."""
    state_file = OUTPUTS_DIR / "jobs_state.json"
    serializable = {}
    for jid, job in jobs.items():
        serializable[jid] = {
            k: v.isoformat() if isinstance(v, datetime) else v
            for k, v in job.items()
        }
    state_file.write_text(json.dumps(serializable, indent=2))


@router.get("/languages", response_model=LanguagesResponse)
async def get_languages():
    """Get available languages and voices for TTS."""
    languages = []
    for code, data in SUPPORTED_VOICES.items():
        voices = []
        for voice_id in data["voices"]:
            # Parse voice info from ID (e.g., af_heart -> American Female)
            gender = "Female" if voice_id[1] == "f" else "Male"
            name = voice_id.split("_")[1].title()
            voices.append(VoiceOption(
                id=voice_id,
                name=name,
                gender=gender
            ))
        languages.append(LanguageOption(
            code=code,
            name=data["name"],
            voices=voices
        ))
    return LanguagesResponse(languages=languages)


@router.post("/upload", response_model=UploadResponse)
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file for dubbing."""
    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}"
        )
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    job_dir = UPLOADS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = job_dir / f"original{ext}"
    content = await file.read()
    
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_UPLOAD_SIZE // (1024*1024)}MB"
        )
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create job entry
    now = datetime.utcnow()
    jobs[job_id] = {
        "job_id": job_id,
        "status": JobStatus.PENDING,
        "progress": 0,
        "message": "Video uploaded successfully",
        "created_at": now,
        "updated_at": now,
        "video_filename": file.filename,
        "video_path": str(file_path),
        "transcript": None,
        "output_url": None,
        "error": None
    }
    
    logger.info(f"Video uploaded: {job_id} - {file.filename}")
    
    return UploadResponse(
        job_id=job_id,
        filename=file.filename,
        size_bytes=len(content),
        message="Video uploaded successfully. Ready for transcription."
    )


@router.post("/transcribe/{job_id}")
async def start_transcription(
    job_id: str,
    request: TranscribeRequest,
    background_tasks: BackgroundTasks
):
    """Start transcription of uploaded video."""
    job = get_job(job_id)
    
    if job["status"] not in [JobStatus.PENDING, JobStatus.TRANSCRIBED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transcribe job in status: {job['status']}"
        )
    
    update_job(job_id, status=JobStatus.TRANSCRIBING, progress=10, message="Starting transcription...")
    
    # Run transcription in background
    background_tasks.add_task(
        run_transcription,
        job_id,
        job["video_path"],
        request.language
    )
    
    return {"message": "Transcription started", "job_id": job_id}


def run_transcription(job_id: str, video_path: str, language: Optional[str]):
    """Background task for transcription."""
    try:
        logger.info(f"="*70)
        logger.info(f"Starting transcription job: {job_id}")
        logger.info(f"Video path: {video_path}")
        logger.info(f"Language: {language or 'auto-detect'}")
        job_start_time = time.time()
        
        update_job(job_id, progress=20, message="Extracting audio...")
        logger.info(f"[{job_id}] Step 1/4: Extracting audio from video...")
        
        # Extract audio
        audio_extract_start = time.time()
        video_service = VideoService()
        audio_path = str(Path(video_path).parent / "audio.wav")
        video_service.extract_audio(video_path, audio_path)
        audio_extract_time = time.time() - audio_extract_start
        
        logger.info(f"[{job_id}] ✓ Audio extraction completed in {audio_extract_time:.2f}s")
        logger.info(f"[{job_id}] Audio saved to: {audio_path}")
        
        update_job(job_id, progress=40, message="Transcribing audio...")
        logger.info(f"[{job_id}] Step 2/4: Starting audio transcription...")
        logger.info(f"[{job_id}] This may take a while depending on audio length...")
        
        # Transcribe
        transcribe_start = time.time()
        transcription_service = TranscriptionService(WHISPER_MODEL)
        result = transcription_service.transcribe(audio_path, language)
        transcribe_time = time.time() - transcribe_start
        
        logger.info(f"[{job_id}] ✓ Transcription completed in {transcribe_time:.2f}s")
        logger.info(f"[{job_id}] Detected language: {result['language']}")
        logger.info(f"[{job_id}] Total segments: {len(result['segments'])}")
        logger.info(f"[{job_id}] Total text length: {len(result['text'])} characters")
        
        update_job(job_id, progress=80, message="Generating SRT...")
        logger.info(f"[{job_id}] Step 3/4: Generating SRT subtitles...")
        
        # Generate SRT
        srt_start = time.time()
        srt_content = transcription_service.segments_to_srt(result["segments"])
        srt_path = Path(video_path).parent / "transcript.srt"
        srt_path.write_text(srt_content, encoding="utf-8")
        srt_time = time.time() - srt_start
        
        logger.info(f"[{job_id}] ✓ SRT file created in {srt_time:.2f}s")
        logger.info(f"[{job_id}] SRT saved to: {srt_path}")
        
        # Store transcript in job
        transcript = {
            "language": result["language"],
            "full_text": result["text"],
            "segments": result["segments"],
            "srt": srt_content
        }
        
        logger.info(f"[{job_id}] Step 4/4: Finalizing transcription job...")
        
        update_job(
            job_id,
            status=JobStatus.TRANSCRIBED,
            progress=100,
            message="Transcription complete",
            transcript=transcript,
            audio_path=audio_path
        )
        
        total_job_time = time.time() - job_start_time
        logger.info(f"="*70)
        logger.info(f"[{job_id}] ✓✓✓ TRANSCRIPTION JOB COMPLETED SUCCESSFULLY ✓✓✓")
        logger.info(f"[{job_id}] Total job time: {total_job_time:.2f}s")
        logger.info(f"[{job_id}] Breakdown:")
        logger.info(f"[{job_id}]   - Audio extraction: {audio_extract_time:.2f}s ({audio_extract_time/total_job_time*100:.1f}%)")
        logger.info(f"[{job_id}]   - Transcription: {transcribe_time:.2f}s ({transcribe_time/total_job_time*100:.1f}%)")
        logger.info(f"[{job_id}]   - SRT generation: {srt_time:.2f}s ({srt_time/total_job_time*100:.1f}%)")
        logger.info(f"="*70)
        
    except Exception as e:
        logger.error(f"="*70)
        logger.error(f"[{job_id}] ✗✗✗ TRANSCRIPTION JOB FAILED ✗✗✗")
        logger.error(f"[{job_id}] Error: {str(e)}")
        logger.error(f"[{job_id}] Error type: {type(e).__name__}")
        logger.error(f"="*70, exc_info=True)
        update_job(
            job_id,
            status=JobStatus.FAILED,
            error=str(e),
            message="Transcription failed"
        )


@router.get("/transcript/{job_id}", response_model=TranscriptResponse)
async def get_transcript(job_id: str):
    """Get transcript for a job."""
    job = get_job(job_id)
    
    if not job.get("transcript"):
        raise HTTPException(
            status_code=400,
            detail="Transcript not available. Run transcription first."
        )
    
    t = job["transcript"]
    return TranscriptResponse(
        language=t["language"],
        full_text=t["full_text"],
        segments=[TranscriptSegment(**s) for s in t["segments"]],
        srt=t.get("srt")
    )


@router.put("/transcript/{job_id}")
async def update_transcript(job_id: str, request: TranscriptUpdateRequest):
    """Update transcript segments (for manual editing)."""
    job = get_job(job_id)
    
    if not job.get("transcript"):
        raise HTTPException(status_code=400, detail="No transcript to update")
    
    # Update segments
    segments = [s.model_dump() for s in request.segments]
    job["transcript"]["segments"] = segments
    job["transcript"]["full_text"] = " ".join(s["text"] for s in segments)
    
    # Regenerate SRT
    transcription_service = TranscriptionService(WHISPER_MODEL)
    job["transcript"]["srt"] = transcription_service.segments_to_srt(segments)
    
    update_job(job_id, transcript=job["transcript"])
    
    return {"message": "Transcript updated", "job_id": job_id}


@router.post("/generate-voice/{job_id}")
async def generate_voice(
    job_id: str,
    request: GenerateVoiceRequest,
    background_tasks: BackgroundTasks
):
    """Generate voiceover from transcript."""
    job = get_job(job_id)
    
    if job["status"] not in [JobStatus.TRANSCRIBED, JobStatus.VOICE_GENERATED]:
        raise HTTPException(
            status_code=400,
            detail="Transcription must be complete before generating voice"
        )
    
    if not job.get("transcript"):
        raise HTTPException(status_code=400, detail="No transcript available")
    
    update_job(
        job_id,
        status=JobStatus.GENERATING_VOICE,
        progress=10,
        message="Starting voice generation..."
    )
    
    background_tasks.add_task(
        run_voice_generation,
        job_id,
        job["transcript"]["segments"],
        request.language_code,
        request.voice,
        request.speed
    )
    
    return {"message": "Voice generation started", "job_id": job_id}


def run_voice_generation(
    job_id: str,
    segments: list,
    lang_code: str,
    voice: str,
    speed: float
):
    """Background task for voice generation."""
    try:
        job = jobs[job_id]
        job_dir = Path(job["video_path"]).parent
        segments_dir = job_dir / "segments"
        
        update_job(job_id, progress=20, message="Initializing TTS...")
        
        # Generate audio for each segment
        tts_service = TTSService(lang_code)
        
        total_segments = len(segments)
        generated_segments = []
        
        for i, seg in enumerate(segments):
            progress = 20 + int((i / total_segments) * 60)
            update_job(job_id, progress=progress, message=f"Generating segment {i+1}/{total_segments}...")
            
            text = seg.get("text", "").strip()
            if not text:
                continue
            
            output_path = segments_dir / f"segment_{i:04d}.wav"
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            try:
                tts_service.generate_to_file(text, str(output_path), voice, speed)
                generated_segments.append({
                    "id": seg.get("id", i),
                    "start": seg["start"],
                    "end": seg["end"],
                    "audio_path": str(output_path),
                    "text": text
                })
            except Exception as e:
                logger.warning(f"Failed to generate segment {i}: {e}")
        
        update_job(job_id, progress=85, message="Concatenating audio segments...")
        
        # Get video duration
        video_service = VideoService()
        video_info = video_service.get_video_info(job["video_path"])
        duration = video_info["duration"]
        
        # Concatenate with timing
        output_audio = job_dir / "voiceover.wav"
        video_service.concatenate_audio_with_timing(
            generated_segments,
            duration,
            str(output_audio)
        )
        
        update_job(
            job_id,
            status=JobStatus.VOICE_GENERATED,
            progress=100,
            message="Voice generation complete",
            voiceover_path=str(output_audio),
            voice_settings={"lang_code": lang_code, "voice": voice, "speed": speed}
        )
        
        logger.info(f"Voice generation complete: {job_id}")
        
    except Exception as e:
        logger.error(f"Voice generation failed for {job_id}: {e}")
        update_job(
            job_id,
            status=JobStatus.FAILED,
            error=str(e),
            message="Voice generation failed"
        )


@router.post("/merge-video/{job_id}")
async def merge_video(job_id: str, background_tasks: BackgroundTasks):
    """Merge generated voiceover with original video."""
    job = get_job(job_id)
    
    if job["status"] != JobStatus.VOICE_GENERATED:
        raise HTTPException(
            status_code=400,
            detail="Voice must be generated before merging"
        )
    
    if not job.get("voiceover_path"):
        raise HTTPException(status_code=400, detail="No voiceover available")
    
    update_job(job_id, status=JobStatus.MERGING, progress=10, message="Starting video merge...")
    
    background_tasks.add_task(run_video_merge, job_id)
    
    return {"message": "Video merge started", "job_id": job_id}


def run_video_merge(job_id: str):
    """Background task for video merge."""
    try:
        job = jobs[job_id]
        
        update_job(job_id, progress=30, message="Merging audio with video...")
        
        # Create output directory
        output_dir = OUTPUTS_DIR / job_id
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Determine output filename
        original_name = Path(job["video_filename"]).stem
        output_path = output_dir / f"{original_name}_dubbed.mp4"
        
        # Merge video and audio
        video_service = VideoService()
        video_service.replace_audio(
            job["video_path"],
            job["voiceover_path"],
            str(output_path)
        )
        
        update_job(
            job_id,
            status=JobStatus.COMPLETED,
            progress=100,
            message="Dubbing complete!",
            output_path=str(output_path),
            output_url=f"/api/download/{job_id}"
        )
        
        logger.info(f"Video merge complete: {job_id}")
        
    except Exception as e:
        logger.error(f"Video merge failed for {job_id}: {e}")
        update_job(
            job_id,
            status=JobStatus.FAILED,
            error=str(e),
            message="Video merge failed"
        )


@router.get("/job/{job_id}", response_model=JobResponse)
async def get_job_status(job_id: str):
    """Get current job status."""
    job = get_job(job_id)
    
    transcript = None
    if job.get("transcript"):
        t = job["transcript"]
        transcript = TranscriptResponse(
            language=t["language"],
            full_text=t["full_text"],
            segments=[TranscriptSegment(**s) for s in t["segments"]],
            srt=t.get("srt")
        )
    
    return JobResponse(
        job_id=job["job_id"],
        status=job["status"],
        progress=job["progress"],
        message=job.get("message"),
        created_at=job["created_at"],
        updated_at=job["updated_at"],
        video_filename=job.get("video_filename"),
        transcript=transcript,
        output_url=job.get("output_url"),
        error=job.get("error")
    )


@router.get("/download/{job_id}")
async def download_video(job_id: str):
    """Download the dubbed video."""
    job = get_job(job_id)
    
    if job["status"] != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Video not ready for download")
    
    output_path = job.get("output_path")
    if not output_path or not Path(output_path).exists():
        raise HTTPException(status_code=404, detail="Output file not found")
    
    original_name = Path(job["video_filename"]).stem
    return FileResponse(
        output_path,
        media_type="video/mp4",
        filename=f"{original_name}_dubbed.mp4"
    )


@router.get("/download/{job_id}/srt")
async def download_srt(job_id: str):
    """Download the SRT subtitle file."""
    job = get_job(job_id)
    
    if not job.get("transcript"):
        raise HTTPException(status_code=400, detail="No transcript available")
    
    srt_path = Path(job["video_path"]).parent / "transcript.srt"
    if not srt_path.exists():
        raise HTTPException(status_code=404, detail="SRT file not found")
    
    original_name = Path(job["video_filename"]).stem
    return FileResponse(
        str(srt_path),
        media_type="text/plain",
        filename=f"{original_name}.srt"
    )
