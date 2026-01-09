import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import type { Job, JobStatus } from '../api';

interface UseJobOptions {
    pollingInterval?: number;
    onStatusChange?: (status: JobStatus) => void;
    onComplete?: (job: Job) => void;
    onError?: (error: string) => void;
}

export function useJob(jobId: string | null, options: UseJobOptions = {}) {
    const {
        pollingInterval = 1000,
        onStatusChange,
        onComplete,
        onError,
    } = options;

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const previousStatusRef = useRef<JobStatus | null>(null);
    const pollingRef = useRef<number | null>(null);
    // Use refs for callbacks to avoid dependency issues
    const onStatusChangeRef = useRef(onStatusChange);
    const onCompleteRef = useRef(onComplete);
    const onErrorRef = useRef(onError);

    // Update refs when callbacks change
    useEffect(() => {
        onStatusChangeRef.current = onStatusChange;
        onCompleteRef.current = onComplete;
        onErrorRef.current = onError;
    }, [onStatusChange, onComplete, onError]);

    // Define stopPolling first so it can be used in other callbacks
    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const fetchJob = useCallback(async () => {
        if (!jobId) return;

        try {
            const data = await api.getJobStatus(jobId);
            setJob(data);
            setError(null);

            // Call status change callback
            if (data.status !== previousStatusRef.current) {
                previousStatusRef.current = data.status;
                onStatusChangeRef.current?.(data.status);
            }

            // Handle completion
            if (data.status === 'completed') {
                onCompleteRef.current?.(data);
                stopPolling();
            }

            // Handle error
            if (data.status === 'failed' && data.error) {
                onErrorRef.current?.(data.error);
                stopPolling();
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch job';
            setError(message);
            onErrorRef.current?.(message);
        }
    }, [jobId, stopPolling]);

    const startPolling = useCallback(() => {
        stopPolling();
        pollingRef.current = window.setInterval(fetchJob, pollingInterval);
    }, [fetchJob, pollingInterval, stopPolling]);

    // Initial fetch when jobId changes
    useEffect(() => {
        if (jobId) {
            setLoading(true);
            fetchJob().finally(() => setLoading(false));
        }

        return () => stopPolling();
    }, [jobId, fetchJob, stopPolling]);

    // Update polling based on job status
    useEffect(() => {
        if (!job) return;

        const activeStatuses: JobStatus[] = [
            'uploading',
            'transcribing',
            'generating_voice',
            'merging',
        ];

        if (activeStatuses.includes(job.status)) {
            startPolling();
        } else {
            stopPolling();
        }
    }, [job?.status, startPolling, stopPolling]);

    return {
        job,
        loading,
        error,
        refetch: fetchJob,
        startPolling,
        stopPolling,
    };
}

export default useJob;
