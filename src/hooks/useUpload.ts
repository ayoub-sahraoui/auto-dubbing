import { useState, useCallback } from 'react';
import { api, ApiError } from '../api';
import type { UploadResponse } from '../api';

interface UseUploadReturn {
    upload: (file: File) => Promise<UploadResponse>;
    uploading: boolean;
    progress: number;
    error: string | null;
    reset: () => void;
}

export function useUpload(): UseUploadReturn {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const upload = useCallback(async (file: File): Promise<UploadResponse> => {
        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            const response = await api.uploadVideo(file, (prog) => {
                setProgress(prog);
            });
            setProgress(100);
            return response;
        } catch (err) {
            const message = err instanceof ApiError
                ? err.message
                : 'Upload failed. Please try again.';
            setError(message);
            throw err;
        } finally {
            setUploading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setUploading(false);
        setProgress(0);
        setError(null);
    }, []);

    return {
        upload,
        uploading,
        progress,
        error,
        reset,
    };
}

export default useUpload;
