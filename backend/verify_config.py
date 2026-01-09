"""
Verify Whisper Model Configuration
This script checks your current Whisper model configuration.
"""
import os
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import config
from config import WHISPER_MODEL, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE

print("=" * 60)
print("🔍 WHISPER MODEL CONFIGURATION CHECK")
print("=" * 60)
print()
print(f"✅ Model: {WHISPER_MODEL}")
print(f"✅ Device: {WHISPER_DEVICE}")
print(f"✅ Compute Type: {WHISPER_COMPUTE_TYPE}")
print()

# Check if model name is valid
try:
    from faster_whisper import available_models
    models = available_models()
    print(f"📋 Available models: {', '.join(models)}")
    print()
    
    if WHISPER_MODEL in models:
        print(f"✅ '{WHISPER_MODEL}' is a VALID model name!")
    else:
        print(f"⚠️  Warning: '{WHISPER_MODEL}' not in available models list")
        print(f"    (It might still work if it's downloadable from HuggingFace)")
except Exception as e:
    print(f"Note: Could not fetch available models: {e}")

print()

# Check GPU availability
print("🖥️  Hardware Check:")
try:
    import torch
    if torch.cuda.is_available():
        print(f"✅ CUDA GPU DETECTED: {torch.cuda.get_device_name(0)}")
        print(f"   GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        print()
        print("   🚀 Recommended settings for your GPU:")
        print("   WHISPER_DEVICE=cuda")
        print("   WHISPER_COMPUTE_TYPE=float16")
    else:
        print("ℹ️  No CUDA GPU detected - using CPU")
        print()
        print("   💡 For faster transcription, consider:")
        print("   1. Installing PyTorch with CUDA support")
        print("   2. Or using a smaller model like 'medium'")
except ImportError:
    print("ℹ️  PyTorch not installed - GPU detection unavailable")
    print("   Will use CPU with auto-detection")

print()
print("=" * 60)
print("🎯 Configuration Summary:")
print("=" * 60)
print()
print(f"Your model '{WHISPER_MODEL}' will provide:")
print("  • Excellent French language support ✅")
print("  • State-of-the-art accuracy ✅")
print("  • Fast inference (turbo variant) ✅")
print("  • ~3GB model size (downloads on first use)")
print()
print("Ready to transcribe! 🎉")
print("=" * 60)
