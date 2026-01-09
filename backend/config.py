"""Configuration settings for the auto-dubbing backend."""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base directories
BASE_DIR = Path(__file__).resolve().parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
OUTPUTS_DIR = STORAGE_DIR / "outputs"

# Create directories if they don't exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

# Whisper settings
# Models: tiny, base, small, medium, large-v3, large-v3-turbo
# large-v3-turbo: Best balance of speed and accuracy, excellent for French
# large-v3: Highest accuracy but slower
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "large-v3-turbo")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "auto")  # auto, cpu, cuda
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "auto")  # auto, int8, float16, float32

# Kokoro TTS settings
KOKORO_DEFAULT_VOICE = os.getenv("KOKORO_DEFAULT_VOICE", "af_heart")
KOKORO_DEFAULT_LANG = os.getenv("KOKORO_DEFAULT_LANG", "a")  # 'a' for American English

# Supported voices by language
SUPPORTED_VOICES = {
    "a": {  # American English
        "name": "American English",
        "voices": ["af_heart", "af_bella", "af_nicole", "af_sarah", "af_sky", "am_adam", "am_michael"]
    },
    "b": {  # British English
        "name": "British English", 
        "voices": ["bf_emma", "bf_isabella", "bm_george", "bm_lewis"]
    },
    "j": {  # Japanese
        "name": "Japanese",
        "voices": ["jf_alpha", "jf_gongitsune", "jm_kumo"]
    },
    "z": {  # Mandarin Chinese
        "name": "Mandarin Chinese",
        "voices": ["zf_xiaobei", "zf_xiaoni", "zf_xiaoxiao", "zm_yunjian"]
    },
    "f": {  # French
        "name": "French",
        "voices": ["ff_siwis"]
    }
}

# File settings
MAX_UPLOAD_SIZE = 500 * 1024 * 1024  # 500MB
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".webm"}
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".aac", ".flac", ".ogg"}

# Redis/Celery settings
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# CORS settings
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
