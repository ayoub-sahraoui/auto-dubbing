"""Text-to-Speech service using Kokoro ONNX."""
import io
import logging
from pathlib import Path
from typing import Optional, Tuple
import soundfile as sf
import numpy as np

logger = logging.getLogger(__name__)

# Lazy imports for kokoro-onnx
_kokoro = None
_voices = None


def get_kokoro():
    """Lazy load Kokoro ONNX model."""
    global _kokoro, _voices
    if _kokoro is None:
        try:
            from kokoro_onnx import Kokoro
            logger.info("Loading Kokoro ONNX model...")
            _kokoro = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
            logger.info("Kokoro ONNX model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Kokoro: {e}")
            logger.info("Downloading Kokoro models...")
            # Models will be auto-downloaded on first use
            from kokoro_onnx import Kokoro
            _kokoro = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
    return _kokoro


class TTSService:
    """Service for text-to-speech using Kokoro ONNX."""
    
    # Mapping of our lang codes to Kokoro's expected lang parameter
    LANG_MAP = {
        "a": "en-us",  # American English
        "b": "en-gb",  # British English
        "j": "ja",     # Japanese
        "z": "zh",     # Mandarin Chinese
        "f": "fr-fr",  # French
    }
    
    def __init__(self, lang_code: str = "a"):
        """Initialize TTS service.
        
        Args:
            lang_code: Language code (used for voice selection)
                - 'a': American English
                - 'b': British English
                - 'j': Japanese
                - 'z': Mandarin Chinese
                - 'f': French
        """
        self.lang_code = lang_code
        self.lang = self.LANG_MAP.get(lang_code, "en-us")  # Get proper lang format
        self._kokoro = None
    
    @property
    def kokoro(self):
        """Lazy load the Kokoro model."""
        if self._kokoro is None:
            self._kokoro = get_kokoro()
        return self._kokoro
    
    def generate(
        self,
        text: str,
        voice: str = "af_heart",
        speed: float = 1.0
    ) -> Tuple[np.ndarray, int]:
        """Generate speech from text.
        
        Args:
            text: Text to convert to speech
            voice: Voice ID to use (e.g., 'af_heart', 'am_adam')
            speed: Speed multiplier (0.5 to 2.0)
            
        Returns:
            Tuple of (audio_array, sample_rate)
        """
        logger.info(f"Generating TTS: voice={voice}, lang={self.lang}, speed={speed}, text_len={len(text)}")
        
        try:
            # Generate audio using kokoro-onnx with language parameter
            audio, sample_rate = self.kokoro.create(
                text, 
                voice=voice, 
                speed=speed,
                lang=self.lang  # Add language parameter
            )
            
            if audio is None or len(audio) == 0:
                raise ValueError("No audio generated")
            
            return audio, sample_rate
            
        except Exception as e:
            logger.error(f"TTS generation failed: {e}")
            raise
    
    def generate_to_file(
        self,
        text: str,
        output_path: str,
        voice: str = "af_heart",
        speed: float = 1.0
    ) -> str:
        """Generate speech and save to file.
        
        Args:
            text: Text to convert
            output_path: Path to save audio file
            voice: Voice ID
            speed: Speed multiplier
            
        Returns:
            Path to saved audio file
        """
        audio, sample_rate = self.generate(text, voice, speed)
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        sf.write(str(output_path), audio, sample_rate)
        logger.info(f"Audio saved to: {output_path}")
        
        return str(output_path)
    
    def generate_segments(
        self,
        segments: list,
        output_dir: str,
        voice: str = "af_heart",
        speed: float = 1.0
    ) -> list:
        """Generate audio for each transcript segment.
        
        Args:
            segments: List of transcript segments with 'text', 'start', 'end'
            output_dir: Directory to save segment audio files
            voice: Voice ID
            speed: Speed multiplier
            
        Returns:
            List of segment audio file paths with timing info
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        results = []
        
        for i, seg in enumerate(segments):
            text = seg.get("text", "").strip()
            if not text:
                continue
            
            output_path = output_dir / f"segment_{i:04d}.wav"
            
            try:
                self.generate_to_file(text, str(output_path), voice, speed)
                results.append({
                    "id": seg.get("id", i),
                    "start": seg["start"],
                    "end": seg["end"],
                    "audio_path": str(output_path),
                    "text": text
                })
            except Exception as e:
                logger.warning(f"Failed to generate segment {i}: {e}")
                continue
        
        return results
