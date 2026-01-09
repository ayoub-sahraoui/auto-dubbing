import type { Job, JobStatus } from '../api';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ProcessingStatusProps {
    job: Job | null;
}

const statusConfig: Record<JobStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'destructive'; icon: 'loading' | 'check' | 'error' }> = {
    pending: { label: 'Ready to process', variant: 'default', icon: 'loading' },
    uploading: { label: 'Uploading video...', variant: 'default', icon: 'loading' },
    transcribing: { label: 'Transcribing audio...', variant: 'warning', icon: 'loading' },
    transcribed: { label: 'Transcription complete', variant: 'success', icon: 'check' },
    generating_voice: { label: 'Generating voiceover...', variant: 'warning', icon: 'loading' },
    voice_generated: { label: 'Voice generated', variant: 'success', icon: 'check' },
    merging: { label: 'Creating final video...', variant: 'warning', icon: 'loading' },
    completed: { label: 'Complete!', variant: 'success', icon: 'check' },
    failed: { label: 'Failed', variant: 'destructive', icon: 'error' },
};

export function ProcessingStatus({ job }: ProcessingStatusProps) {
    if (!job) {
        return null;
    }

    const config = statusConfig[job.status];
    const isProcessing = ['uploading', 'transcribing', 'generating_voice', 'merging'].includes(job.status);

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Status Icon */}
                <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300",
                    config.variant === 'destructive' && "bg-destructive/10",
                    config.variant === 'success' && "bg-primary/10",
                    config.variant === 'warning' && "bg-accent",
                    config.variant === 'default' && "bg-muted"
                )}>
                    {config.icon === 'loading' && <Loader2 size={32} className="text-primary animate-spin" />}
                    {config.icon === 'check' && <Check size={32} className="text-primary" />}
                    {config.icon === 'error' && <AlertCircle size={32} className="text-destructive" />}
                </div>

                {/* Status Text */}
                <div className="flex-1">
                    <p className={cn(
                        "text-2xl font-bold tracking-tight",
                        config.variant === 'destructive' && "text-destructive",
                        config.variant === 'success' && "text-primary",
                        config.variant === 'warning' && "text-accent-foreground",
                        config.variant === 'default' && "text-muted-foreground"
                    )}>{config.label}</p>
                    {job.message && (
                        <p className="text-base text-muted-foreground mt-2 font-medium">{job.message}</p>
                    )}
                </div>

                {/* Progress Percentage */}
                {isProcessing && (
                    <div className="text-right">
                        <span className="text-4xl font-extrabold text-foreground tabular-nums">{job.progress}%</span>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {isProcessing && (
                <div className="space-y-2">
                    <Progress value={job.progress} className="h-3" />
                </div>
            )}

            {/* Error Message */}
            {job.status === 'failed' && job.error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{job.error}</AlertDescription>
                </Alert>
            )}

            {/* Processing Steps */}
            {isProcessing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
                    <ProcessingStep
                        label="Extract Audio"
                        status={getStepStatus(job.status, 'transcribing', ['uploading'])}
                    />
                    <ProcessingStep
                        label="Transcribe"
                        status={getStepStatus(job.status, 'transcribed', ['transcribing'])}
                    />
                    <ProcessingStep
                        label="Voiceover"
                        status={getStepStatus(job.status, 'voice_generated', ['generating_voice'])}
                    />
                    <ProcessingStep
                        label="Merge Video"
                        status={getStepStatus(job.status, 'completed', ['merging'])}
                    />
                </div>
            )}
        </div>
    );
}

interface ProcessingStepProps {
    label: string;
    status: 'pending' | 'active' | 'complete';
}

function ProcessingStep({ label, status }: ProcessingStepProps) {
    return (
        <div className={cn(
            "p-4 rounded-xl border transition-all duration-300",
            status === 'active' && "bg-card border-primary shadow-md transform -translate-y-1",
            status === 'complete' && "bg-accent border-transparent",
            status === 'pending' && "bg-card border-transparent opacity-50"
        )}>
            <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300",
                    status === 'complete' && "bg-primary",
                    status === 'active' && "bg-primary animate-pulse",
                    status === 'pending' && "bg-muted"
                )}>
                    {status === 'complete' ? (
                        <Check size={16} className="text-primary-foreground" />
                    ) : status === 'active' ? (
                        <Loader2 size={16} className="text-primary-foreground animate-spin" />
                    ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
                    )}
                </div>
                <span className={cn(
                    "text-sm font-bold",
                    status === 'complete' && "text-primary",
                    status === 'active' && "text-foreground",
                    status === 'pending' && "text-muted-foreground"
                )}>
                    {label}
                </span>
            </div>
            <div className={cn(
                "h-1 w-full rounded-full transition-all duration-500",
                status === 'complete' && "bg-primary",
                status === 'active' && "bg-primary/30",
                status === 'pending' && "bg-muted"
            )} />
        </div>
    );
}

function getStepStatus(
    currentStatus: JobStatus,
    completeStatus: JobStatus,
    activeStatuses: JobStatus[]
): 'pending' | 'active' | 'complete' {
    const statusOrder: JobStatus[] = [
        'pending', 'uploading', 'transcribing', 'transcribed',
        'generating_voice', 'voice_generated', 'merging', 'completed'
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);
    const completeIndex = statusOrder.indexOf(completeStatus);

    if (currentIndex >= completeIndex) return 'complete';
    if (activeStatuses.includes(currentStatus)) return 'active';
    return 'pending';
}

export default ProcessingStatus;
