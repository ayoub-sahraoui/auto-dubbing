"""Pydantic schemas for request/response models."""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class JobStatus(str, Enum):
    """Status of a dubbing job."""
    PENDING = "pending"
    UPLOADING = "uploading"
    TRANSCRIBING = "transcribing"
    TRANSCRIBED = "transcribed"
    GENERATING_VOICE = "generating_voice"
    VOICE_GENERATED = "voice_generated"
    MERGING = "merging"
    COMPLETED = "completed"
    FAILED = "failed"


class TranscriptSegment(BaseModel):
    """A single segment of the transcript with timing."""
    id: int
    start: float  # Start time in seconds
    end: float    # End time in seconds
    text: str


class TranscriptResponse(BaseModel):
    """Response containing transcript data."""
    language: str
    full_text: str
    segments: List[TranscriptSegment]
    srt: Optional[str] = None


class JobResponse(BaseModel):
    """Response for job status."""
    job_id: str
    status: JobStatus
    progress: int = Field(ge=0, le=100, default=0)
    message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    video_filename: Optional[str] = None
    transcript: Optional[TranscriptResponse] = None
    output_url: Optional[str] = None
    error: Optional[str] = None


class UploadResponse(BaseModel):
    """Response after successful video upload."""
    job_id: str
    filename: str
    size_bytes: int
    message: str


class TranscribeRequest(BaseModel):
    """Request to start transcription."""
    language: Optional[str] = None  # Auto-detect if not provided


class GenerateVoiceRequest(BaseModel):
    """Request to generate voiceover."""
    language_code: str = Field(default="a", description="Language code: a=American, b=British, j=Japanese, z=Mandarin, f=French")
    voice: str = Field(default="af_heart", description="Voice ID to use")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed multiplier")


class TranscriptUpdateRequest(BaseModel):
    """Request to update transcript text."""
    segments: List[TranscriptSegment]


class VoiceOption(BaseModel):
    """A voice option for TTS."""
    id: str
    name: str
    gender: str
    sample_url: Optional[str] = None


class LanguageOption(BaseModel):
    """A language option with available voices."""
    code: str
    name: str
    voices: List[VoiceOption]


class LanguagesResponse(BaseModel):
    """Response listing all available languages and voices."""
    languages: List[LanguageOption]
