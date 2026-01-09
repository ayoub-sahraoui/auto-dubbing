"""Transcription service using Faster-Whisper."""
from faster_whisper import WhisperModel
from pathlib import Path
from typing import Optional, List, Dict, Any
import logging
import os
import time

logger = logging.getLogger(__name__)


class TranscriptionService:
    """Service for transcribing audio/video using Faster-Whisper."""
    
    _instance: Optional["TranscriptionService"] = None
    _model = None
    
    def __new__(cls, model_size: str = None):
        """Singleton pattern to avoid loading model multiple times."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, model_size: str = None):
        """Initialize the transcription service.
        
        Args:
            model_size: Whisper model size (tiny, base, small, medium, large-v3, large-v3-turbo)
                       If not provided, uses WHISPER_MODEL from environment
        """
        if TranscriptionService._model is None:
            # Import config here to avoid circular imports
            from config import WHISPER_MODEL, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE
            
            model = model_size or WHISPER_MODEL
            device = WHISPER_DEVICE
            compute_type = WHISPER_COMPUTE_TYPE
            
            # Auto-detect device if set to auto
            if device == "auto":
                try:
                    import torch
                    device = "cuda" if torch.cuda.is_available() else "cpu"
                except ImportError:
                    device = "cpu"
            
            # Auto-select compute type based on device
            if compute_type == "auto":
                if device == "cuda":
                    compute_type = "float16"  # Best for GPU
                else:
                    compute_type = "int8"  # Best for CPU
            
            logger.info(f"Loading Faster-Whisper model: {model}")
            logger.info(f"Device: {device}, Compute Type: {compute_type}")
            
            try:
                TranscriptionService._model = WhisperModel(
                    model, 
                    device=device, 
                    compute_type=compute_type,
                    download_root=None,  # Uses default cache
                    num_workers=1
                )
                logger.info("Faster-Whisper model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load model with {device}/{compute_type}: {e}")
                # Fallback to CPU with int8 if GPU fails
                if device != "cpu":
                    logger.info("Falling back to CPU with int8")
                    TranscriptionService._model = WhisperModel(
                        model, 
                        device="cpu", 
                        compute_type="int8"
                    )
                else:
                    raise
    
    @property
    def model(self):
        return TranscriptionService._model
    
    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        task: str = "transcribe"
    ) -> Dict[str, Any]:
        """Transcribe audio file to text.
        
        Args:
            audio_path: Path to audio/video file
            language: Language code (e.g., 'en', 'fr', 'ja'). Auto-detect if None.
            task: 'transcribe' or 'translate' (to English)
            
        Returns:
            Dictionary with text, segments, and detected language
        """
        logger.info(f"=" * 60)
        logger.info(f"Starting transcription for: {audio_path}")
        logger.info(f"Language: {language or 'auto-detect'}, Task: {task}")
        start_time = time.time()
        
        # Initial prompt for better French transcription (if French is specified)
        initial_prompt = None
        if language == "fr":
            initial_prompt = "Transcription en français avec ponctuation correcte."
        
        # Transcribe with faster-whisper
        # For large-v3-turbo: beam_size=3 is optimal (faster than 5, minimal accuracy loss)
        # vad_filter helps remove silence and improve segmentation
        logger.info("Initiating Whisper model transcription...")
        logger.info(f"Model parameters: beam_size=3, vad_filter=True, word_timestamps=False")
        
        transcribe_start = time.time()
        segments_generator, info = self.model.transcribe(
            audio_path,
            language=language,
            task=task,
            beam_size=3,  # Optimal for turbo model
            vad_filter=True,  # Voice Activity Detection
            vad_parameters=dict(min_silence_duration_ms=500),
            word_timestamps=False,  # Set to True if you need word-level timing
            initial_prompt=initial_prompt
        )
        
        logger.info(f"Whisper model initialized in {time.time() - transcribe_start:.2f}s")
        logger.info(f"Detected language: {info.language if info.language else 'unknown'}")
        logger.info("Processing segments...")
        
        # Convert generator to list and format segments
        segments = []
        full_text_parts = []
        segment_process_start = time.time()
        
        for i, seg in enumerate(segments_generator):
            # Log progress every 10 segments
            if i > 0 and i % 10 == 0:
                elapsed = time.time() - segment_process_start
                logger.info(f"Processed {i} segments in {elapsed:.2f}s (avg: {elapsed/i:.2f}s per segment)")
            
            segments.append({
                "id": i,
                "start": seg.start,
                "end": seg.end,
                "text": seg.text.strip()
            })
            full_text_parts.append(seg.text.strip())
        
        segment_process_time = time.time() - segment_process_start
        logger.info(f"Completed processing {len(segments)} segments in {segment_process_time:.2f}s")
        
        detected_language = info.language if info.language else "en"
        
        total_time = time.time() - start_time
        logger.info(f"Transcription completed successfully!")
        logger.info(f"Total time: {total_time:.2f}s")
        logger.info(f"Total segments: {len(segments)}")
        logger.info(f"Total text length: {len(' '.join(full_text_parts))} characters")
        logger.info(f"Language: {detected_language}")
        logger.info(f"=" * 60)
        
        return {
            "text": " ".join(full_text_parts),
            "segments": segments,
            "language": detected_language
        }
    
    def segments_to_srt(self, segments: List[Dict]) -> str:
        """Convert segments to SRT subtitle format.
        
        Args:
            segments: List of segment dictionaries with start, end, text
            
        Returns:
            SRT formatted string
        """
        srt_lines = []
        
        for i, seg in enumerate(segments, 1):
            start = self._seconds_to_srt_time(seg["start"])
            end = self._seconds_to_srt_time(seg["end"])
            text = seg["text"]
            
            srt_lines.append(f"{i}")
            srt_lines.append(f"{start} --> {end}")
            srt_lines.append(text)
            srt_lines.append("")  # Empty line between entries
        
        return "\n".join(srt_lines)
    
    def _seconds_to_srt_time(self, seconds: float) -> str:
        """Convert seconds to SRT time format (HH:MM:SS,mmm)."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
