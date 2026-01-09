# Transcription Logging Details

## Overview
Comprehensive logging has been added to the transcription process to help track progress and identify bottlenecks when processing takes a long time.

## What's Been Added

### 1. Transcription Service Logs (`services/transcription.py`)

The transcription service now logs:

#### Before Transcription
- `============================================================`
- `Starting transcription for: <audio_path>`
- `Language: <language or 'auto-detect'>, Task: <task>`

#### During Model Initialization
- `Initiating Whisper model transcription...`
- `Model parameters: beam_size=3, vad_filter=True, word_timestamps=False`
- `Whisper model initialized in <X.XX>s`
- `Detected language: <language>`
- `Processing segments...`

#### During Segment Processing
- Progress updates every 10 segments:
  - `Processed 10 segments in <X.XX>s (avg: <X.XX>s per segment)`
  - `Processed 20 segments in <X.XX>s (avg: <X.XX>s per segment)`
  - etc.

#### After Completion
- `Completed processing <N> segments in <X.XX>s`
- `Transcription completed successfully!`
- `Total time: <X.XX>s`
- `Total segments: <N>`
- `Total text length: <N> characters`
- `Language: <detected_language>`
- `============================================================`

### 2. Dubbing Router Logs (`routers/dubbing.py`)

The background transcription task now logs:

#### Job Start
```
======================================================================
Starting transcription job: <job_id>
Video path: <path>
Language: <language or 'auto-detect'>
```

#### Step 1: Audio Extraction
```
[<job_id>] Step 1/4: Extracting audio from video...
[<job_id>] ✓ Audio extraction completed in <X.XX>s
[<job_id>] Audio saved to: <path>
```

#### Step 2: Transcription
```
[<job_id>] Step 2/4: Starting audio transcription...
[<job_id>] This may take a while depending on audio length...
[... all the detailed transcription logs from above ...]
[<job_id>] ✓ Transcription completed in <X.XX>s
[<job_id>] Detected language: <language>
[<job_id>] Total segments: <N>
[<job_id>] Total text length: <N> characters
```

#### Step 3: SRT Generation
```
[<job_id>] Step 3/4: Generating SRT subtitles...
[<job_id>] ✓ SRT file created in <X.XX>s
[<job_id>] SRT saved to: <path>
```

#### Step 4: Finalization
```
[<job_id>] Step 4/4: Finalizing transcription job...
======================================================================
[<job_id>] ✓✓✓ TRANSCRIPTION JOB COMPLETED SUCCESSFULLY ✓✓✓
[<job_id>] Total job time: <X.XX>s
[<job_id>] Breakdown:
[<job_id>]   - Audio extraction: <X.XX>s (<XX.X>%)
[<job_id>]   - Transcription: <X.XX>s (<XX.X>%)
[<job_id>]   - SRT generation: <X.XX>s (<XX.X>%)
======================================================================
```

#### On Error
```
======================================================================
[<job_id>] ✗✗✗ TRANSCRIPTION JOB FAILED ✗✗✗
[<job_id>] Error: <error_message>
[<job_id>] Error type: <exception_type>
======================================================================
[Full stack trace follows]
```

## How to Monitor

### 1. Watch Terminal Output
When you run `uvicorn main:app --reload`, you'll see all these logs in real-time.

### 2. Identify Bottlenecks
The logs will help you identify which step takes the longest:
- If **Audio extraction** is slow: Video file might be large or in a complex format
- If **Transcription** is slow: This is normal for long audio files, but you can see progress every 10 segments
- If **SRT generation** is slow: Unusual, might indicate an issue

### 3. Track Progress
For long transcriptions, you'll see:
- Initial setup and model loading
- Progress updates every 10 segments (so you know it's working)
- Final summary with timing breakdown

## Example Output

Here's what a typical transcription looks like:

```
2026-01-09 21:30:00 - root - INFO - ======================================================================
2026-01-09 21:30:00 - root - INFO - Starting transcription job: abc123
2026-01-09 21:30:00 - root - INFO - Video path: /path/to/video.mp4
2026-01-09 21:30:00 - root - INFO - Language: auto-detect
2026-01-09 21:30:00 - root - INFO - [abc123] Step 1/4: Extracting audio from video...
2026-01-09 21:30:05 - root - INFO - [abc123] ✓ Audio extraction completed in 5.23s
2026-01-09 21:30:05 - root - INFO - [abc123] Audio saved to: /path/to/audio.wav
2026-01-09 21:30:05 - root - INFO - [abc123] Step 2/4: Starting audio transcription...
2026-01-09 21:30:05 - root - INFO - [abc123] This may take a while depending on audio length...
2026-01-09 21:30:05 - services.transcription - INFO - ============================================================
2026-01-09 21:30:05 - services.transcription - INFO - Starting transcription for: /path/to/audio.wav
2026-01-09 21:30:05 - services.transcription - INFO - Language: auto-detect, Task: transcribe
2026-01-09 21:30:05 - services.transcription - INFO - Initiating Whisper model transcription...
2026-01-09 21:30:05 - services.transcription - INFO - Model parameters: beam_size=3, vad_filter=True, word_timestamps=False
2026-01-09 21:30:06 - services.transcription - INFO - Whisper model initialized in 0.45s
2026-01-09 21:30:06 - services.transcription - INFO - Detected language: en
2026-01-09 21:30:06 - services.transcription - INFO - Processing segments...
2026-01-09 21:30:15 - services.transcription - INFO - Processed 10 segments in 9.12s (avg: 0.91s per segment)
2026-01-09 21:30:24 - services.transcription - INFO - Processed 20 segments in 18.34s (avg: 0.92s per segment)
2026-01-09 21:30:32 - services.transcription - INFO - Completed processing 25 segments in 26.78s
2026-01-09 21:30:32 - services.transcription - INFO - Transcription completed successfully!
2026-01-09 21:30:32 - services.transcription - INFO - Total time: 27.45s
2026-01-09 21:30:32 - services.transcription - INFO - Total segments: 25
2026-01-09 21:30:32 - services.transcription - INFO - Total text length: 1542 characters
2026-01-09 21:30:32 - services.transcription - INFO - Language: en
2026-01-09 21:30:32 - services.transcription - INFO - ============================================================
2026-01-09 21:30:32 - root - INFO - [abc123] ✓ Transcription completed in 27.45s
2026-01-09 21:30:32 - root - INFO - [abc123] Detected language: en
2026-01-09 21:30:32 - root - INFO - [abc123] Total segments: 25
2026-01-09 21:30:32 - root - INFO - [abc123] Total text length: 1542 characters
2026-01-09 21:30:32 - root - INFO - [abc123] Step 3/4: Generating SRT subtitles...
2026-01-09 21:30:32 - root - INFO - [abc123] ✓ SRT file created in 0.02s
2026-01-09 21:30:32 - root - INFO - [abc123] SRT saved to: /path/to/transcript.srt
2026-01-09 21:30:32 - root - INFO - [abc123] Step 4/4: Finalizing transcription job...
2026-01-09 21:30:32 - root - INFO - ======================================================================
2026-01-09 21:30:32 - root - INFO - [abc123] ✓✓✓ TRANSCRIPTION JOB COMPLETED SUCCESSFULLY ✓✓✓
2026-01-09 21:30:32 - root - INFO - [abc123] Total job time: 32.89s
2026-01-09 21:30:32 - root - INFO - [abc123] Breakdown:
2026-01-09 21:30:32 - root - INFO - [abc123]   - Audio extraction: 5.23s (15.9%)
2026-01-09 21:30:32 - root - INFO - [abc123]   - Transcription: 27.45s (83.5%)
2026-01-09 21:30:32 - root - INFO - [abc123]   - SRT generation: 0.02s (0.1%)
2026-01-09 21:30:32 - root - INFO - ======================================================================
```

## Benefits

1. **Know it's working**: Progress updates every 10 segments reassure you the process hasn't frozen
2. **Identify bottlenecks**: See which step takes the most time
3. **Debug issues**: Detailed error messages with full stack traces
4. **Performance tracking**: Time breakdowns help you understand the process
5. **Production ready**: All logs include job IDs for tracking multiple concurrent jobs

## Note

The backend should have automatically reloaded with these changes. Just start a new transcription job and watch the terminal for these detailed logs!
