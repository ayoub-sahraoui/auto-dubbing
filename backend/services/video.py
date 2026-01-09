"""Video processing service using FFmpeg."""
import subprocess
import json
import logging
from pathlib import Path
from typing import Optional, List, Dict
import ffmpeg

logger = logging.getLogger(__name__)


class VideoService:
    """Service for video/audio processing using FFmpeg."""
    
    def __init__(self):
        """Initialize video service."""
        self._check_ffmpeg()
    
    def _check_ffmpeg(self):
        """Check if FFmpeg is available."""
        try:
            subprocess.run(
                ["ffmpeg", "-version"],
                capture_output=True,
                check=True
            )
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("FFmpeg not found. Please install FFmpeg.")
            raise RuntimeError("FFmpeg is not installed or not in PATH")
    
    def get_video_info(self, video_path: str) -> Dict:
        """Get video metadata.
        
        Args:
            video_path: Path to video file
            
        Returns:
            Dictionary with duration, width, height, fps, etc.
        """
        try:
            probe = ffmpeg.probe(video_path)
            video_stream = next(
                (s for s in probe["streams"] if s["codec_type"] == "video"),
                None
            )
            audio_stream = next(
                (s for s in probe["streams"] if s["codec_type"] == "audio"),
                None
            )
            
            info = {
                "duration": float(probe["format"].get("duration", 0)),
                "size": int(probe["format"].get("size", 0)),
                "format": probe["format"].get("format_name", ""),
            }
            
            if video_stream:
                info.update({
                    "width": video_stream.get("width"),
                    "height": video_stream.get("height"),
                    "fps": eval(video_stream.get("r_frame_rate", "0/1")),
                    "video_codec": video_stream.get("codec_name"),
                })
            
            if audio_stream:
                info.update({
                    "audio_codec": audio_stream.get("codec_name"),
                    "sample_rate": int(audio_stream.get("sample_rate", 0)),
                    "channels": audio_stream.get("channels"),
                })
            
            return info
        except ffmpeg.Error as e:
            logger.error(f"Error probing video: {e}")
            raise
    
    def extract_audio(
        self,
        video_path: str,
        output_path: str,
        format: str = "wav"
    ) -> str:
        """Extract audio from video file.
        
        Args:
            video_path: Path to input video
            output_path: Path for output audio
            format: Output audio format
            
        Returns:
            Path to extracted audio file
        """
        logger.info(f"Extracting audio from: {video_path}")
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            (
                ffmpeg
                .input(video_path)
                .output(str(output_path), acodec="pcm_s16le" if format == "wav" else None)
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            logger.info(f"Audio extracted to: {output_path}")
            return str(output_path)
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error: {e.stderr.decode()}")
            raise
    
    def replace_audio(
        self,
        video_path: str,
        audio_path: str,
        output_path: str,
        keep_original_audio: bool = False,
        original_volume: float = 0.1
    ) -> str:
        """Replace video audio with new audio track.
        
        Args:
            video_path: Path to input video
            audio_path: Path to new audio
            output_path: Path for output video
            keep_original_audio: Mix original audio at lower volume
            original_volume: Volume of original audio if kept (0.0-1.0)
            
        Returns:
            Path to output video
        """
        logger.info(f"Replacing audio in: {video_path}")
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            video_input = ffmpeg.input(video_path)
            audio_input = ffmpeg.input(audio_path)
            
            if keep_original_audio:
                # Mix original and new audio
                original_audio = video_input.audio.filter("volume", original_volume)
                mixed = ffmpeg.filter([original_audio, audio_input.audio], "amix", inputs=2)
                output = ffmpeg.output(
                    video_input.video,
                    mixed,
                    str(output_path),
                    vcodec="copy"
                )
            else:
                # Replace audio completely
                output = ffmpeg.output(
                    video_input.video,
                    audio_input.audio,
                    str(output_path),
                    vcodec="copy",
                    acodec="aac"
                )
            
            output.overwrite_output().run(capture_stdout=True, capture_stderr=True)
            logger.info(f"Video with new audio saved to: {output_path}")
            return str(output_path)
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error: {e.stderr.decode()}")
            raise
    
    def concatenate_audio_with_timing(
        self,
        segments: List[Dict],
        total_duration: float,
        output_path: str,
        sample_rate: int = 24000
    ) -> str:
        """Concatenate audio segments with proper timing/padding.
        
        Args:
            segments: List of dicts with 'audio_path', 'start', 'end'
            total_duration: Total duration of the output
            output_path: Path for output audio
            sample_rate: Sample rate for output
            
        Returns:
            Path to concatenated audio file
        """
        import numpy as np
        import soundfile as sf
        
        logger.info(f"Concatenating {len(segments)} audio segments")
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Calculate total samples
        total_samples = int(total_duration * sample_rate)
        output_audio = np.zeros(total_samples, dtype=np.float32)
        
        for seg in segments:
            audio_path = seg.get("audio_path")
            start_time = seg.get("start", 0)
            
            if not audio_path or not Path(audio_path).exists():
                continue
            
            # Load segment audio
            segment_audio, sr = sf.read(audio_path)
            
            # Resample if needed
            if sr != sample_rate:
                # Simple resampling (for production, use librosa or scipy)
                ratio = sample_rate / sr
                new_length = int(len(segment_audio) * ratio)
                indices = np.linspace(0, len(segment_audio) - 1, new_length).astype(int)
                segment_audio = segment_audio[indices]
            
            # Calculate start position in samples
            start_sample = int(start_time * sample_rate)
            end_sample = min(start_sample + len(segment_audio), total_samples)
            
            # Ensure we don't overflow
            segment_length = end_sample - start_sample
            output_audio[start_sample:end_sample] = segment_audio[:segment_length]
        
        # Save output
        sf.write(str(output_path), output_audio, sample_rate)
        logger.info(f"Concatenated audio saved to: {output_path}")
        
        return str(output_path)
    
    def create_video_with_subtitles(
        self,
        video_path: str,
        srt_path: str,
        output_path: str
    ) -> str:
        """Burn subtitles into video.
        
        Args:
            video_path: Path to input video
            srt_path: Path to SRT subtitle file
            output_path: Path for output video
            
        Returns:
            Path to output video with subtitles
        """
        logger.info(f"Adding subtitles to: {video_path}")
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            (
                ffmpeg
                .input(video_path)
                .output(
                    str(output_path),
                    vf=f"subtitles={srt_path}"
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            logger.info(f"Video with subtitles saved to: {output_path}")
            return str(output_path)
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error: {e.stderr.decode()}")
            raise
