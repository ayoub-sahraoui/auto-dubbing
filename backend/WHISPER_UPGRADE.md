# Whisper Model Upgrade Guide

## Overview
The auto-dubbing backend has been upgraded to use **Whisper Large-v3-Turbo** model by default, providing significantly better transcription quality, especially for French and other non-English languages.

## What Changed

### 1. **Model Upgrade**
- **Previous**: Whisper Base model (74M parameters)
- **Current**: Whisper Large-v3-Turbo (1550M parameters)

### 2. **Benefits**
- ✅ **Better French Support**: Large-v3-turbo is specifically optimized for multilingual transcription
- ✅ **Higher Accuracy**: Near-perfect transcription for clear audio
- ✅ **Faster than Large-v3**: Turbo variant is 8x faster than the full large-v3 model
- ✅ **Auto GPU Detection**: Automatically uses GPU if available
- ✅ **Smart Fallback**: Falls back to CPU if GPU is not available

### 3. **Performance Impact**
- **First Run**: Model will be downloaded (~3GB) - this happens only once
- **Model Loading**: ~5-10 seconds on first request (then cached)
- **Transcription Speed**:
  - **With GPU (CUDA)**: Real-time or faster (1 minute of audio in <1 minute)
  - **With CPU**: About 2-4x slower than real-time (1 minute of audio in 2-4 minutes)

## Configuration

### Environment Variables (`.env` file)
Create a `.env` file in the `backend` directory (use `.env.example` as template):

```env
# Use large-v3-turbo for best results (default)
WHISPER_MODEL=large-v3-turbo

# Auto-detect GPU, or use 'cpu' or 'cuda'
WHISPER_DEVICE=auto

# Auto-select compute type (recommended)
WHISPER_COMPUTE_TYPE=auto
```

### Available Models
You can change the model by setting `WHISPER_MODEL` in your `.env`:

| Model | Size | Speed | Accuracy | Best For |
|-------|------|-------|----------|----------|
| `tiny` | 39M | ⚡⚡⚡⚡⚡ | ⭐⭐ | Quick testing |
| `base` | 74M | ⚡⚡⚡⚡ | ⭐⭐⭐ | Basic transcription |
| `small` | 244M | ⚡⚡⚡ | ⭐⭐⭐⭐ | Good balance |
| `medium` | 769M | ⚡⚡ | ⭐⭐⭐⭐⭐ | High quality |
| `large-v3-turbo` | 1550M | ⚡⚡ | ⭐⭐⭐⭐⭐⭐ | **Recommended** |
| `large-v3` | 1550M | ⚡ | ⭐⭐⭐⭐⭐⭐ | Highest accuracy |

### Device & Compute Type
- **auto** (recommended): Automatically detects and uses the best settings
- **cuda**: Force GPU usage (requires NVIDIA GPU with CUDA)
- **cpu**: Force CPU usage

## GPU Acceleration (Optional but Recommended)

For **much faster** transcription, install GPU support:

### Prerequisites
1. NVIDIA GPU with CUDA support
2. CUDA Toolkit 11.8 or 12.x

### Installation
```bash
# Install PyTorch with CUDA support (choose based on your CUDA version)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Or for CUDA 12.x:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

Then restart the backend server. It will automatically detect and use GPU.

## French Language Optimization

The service now includes special optimizations for French:
- **Initial Prompt**: Helps the model understand French context better
- **VAD Filter**: Removes silence for cleaner transcription
- **Optimal Beam Size**: Set to 3 for turbo model (best speed/accuracy trade-off)

## Testing

After the upgrade, test with a French audio file:

```bash
# The backend will log which device and model it's using
# Check the console output for:
# - "Loading Faster-Whisper model: large-v3-turbo"
# - "Device: cuda, Compute Type: float16" (if GPU is available)
# - OR "Device: cpu, Compute Type: int8" (if CPU only)
```

## Troubleshooting

### Model Download Issues
If the model fails to download:
```bash
# The model is cached in: ~/.cache/huggingface/hub/
# You can manually delete and retry, or check internet connection
```

### Out of Memory (GPU)
If you get CUDA out of memory errors:
```env
# Switch to CPU in .env:
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
```

### Slow Transcription
- For faster results with slightly lower quality, use `medium` model
- Enable GPU acceleration (see above)
- The first transcription is always slower due to model loading

## Next Steps

1. **Copy `.env.example` to `.env`** if it doesn't exist
2. **Restart the backend** to load the new model
3. **Test with French audio** to see the quality improvement
4. **(Optional) Install GPU support** for much faster processing

## Need Help?

- Check logs in the console for detailed information
- Model will auto-download on first use (~3GB)
- Contact support if issues persist
