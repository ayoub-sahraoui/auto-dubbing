/**
 * API Configuration and Client for Auto-Dubbing Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Job status enum matching backend
 */
export type JobStatus =
    | 'pending'
    | 'uploading'
    | 'transcribing'
    | 'transcribed'
    | 'generating_voice'
    | 'voice_generated'
    | 'merging'
    | 'completed'
    | 'failed';

/**
 * Transcript segment with timing
 */
export interface TranscriptSegment {
    id: number;
    start: number;
    end: number;
    text: string;
}

/**
 * Transcript data
 */
export interface Transcript {
    language: string;
    full_text: string;
    segments: TranscriptSegment[];
    srt?: string;
}

/**
 * Job response from API
 */
export interface Job {
    job_id: string;
    status: JobStatus;
    progress: number;
    message?: string;
    created_at: string;
    updated_at: string;
    video_filename?: string;
    transcript?: Transcript;
    output_url?: string;
    error?: string;
}

/**
 * Upload response
 */
export interface UploadResponse {
    job_id: string;
    filename: string;
    size_bytes: number;
    message: string;
}

/**
 * Voice option
 */
export interface Voice {
    id: string;
    name: string;
    gender: string;
    sample_url?: string;
}

/**
 * Language option
 */
export interface Language {
    code: string;
    name: string;
    voices: Voice[];
}

/**
 * Languages response
 */
export interface LanguagesResponse {
    languages: Language[];
}

/**
 * API Error class
 */
export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

/**
 * Make API request with error handling
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Accept': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new ApiError(error.detail || 'Request failed', response.status);
    }

    return response.json();
}

/**
 * API Client
 */
export const api = {
    /**
     * Get available languages and voices
     */
    getLanguages: () =>
        apiRequest<LanguagesResponse>('/api/languages'),

    /**
     * Upload a video file
     */
    uploadVideo: async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        // For progress tracking, we need XMLHttpRequest
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new ApiError(error.detail || 'Upload failed', xhr.status));
                    } catch {
                        reject(new ApiError('Upload failed', xhr.status));
                    }
                }
            });

            xhr.addEventListener('error', () => {
                reject(new ApiError('Network error', 0));
            });

            xhr.open('POST', `${API_BASE_URL}/api/upload`);
            xhr.send(formData);
        });
    },

    /**
     * Start transcription
     */
    startTranscription: (jobId: string, language?: string) =>
        apiRequest<{ message: string; job_id: string }>(`/api/transcribe/${jobId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language }),
        }),

    /**
     * Get transcript
     */
    getTranscript: (jobId: string) =>
        apiRequest<Transcript>(`/api/transcript/${jobId}`),

    /**
     * Update transcript
     */
    updateTranscript: (jobId: string, segments: TranscriptSegment[]) =>
        apiRequest<{ message: string; job_id: string }>(`/api/transcript/${jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ segments }),
        }),

    /**
     * Generate voiceover
     */
    generateVoice: (jobId: string, languageCode: string, voice: string, speed: number = 1.0) =>
        apiRequest<{ message: string; job_id: string }>(`/api/generate-voice/${jobId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language_code: languageCode,
                voice,
                speed,
            }),
        }),

    /**
     * Merge video with new audio
     */
    mergeVideo: (jobId: string) =>
        apiRequest<{ message: string; job_id: string }>(`/api/merge-video/${jobId}`, {
            method: 'POST',
        }),

    /**
     * Get job status
     */
    getJobStatus: (jobId: string) =>
        apiRequest<Job>(`/api/job/${jobId}`),

    /**
     * Get download URL for dubbed video
     */
    getDownloadUrl: (jobId: string) =>
        `${API_BASE_URL}/api/download/${jobId}`,

    /**
     * Get download URL for SRT file
     */
    getSrtDownloadUrl: (jobId: string) =>
        `${API_BASE_URL}/api/download/${jobId}/srt`,
};

export default api;
