import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Step = 'upload' | 'source-lang' | 'transcribe' | 'edit' | 'voice' | 'complete';

interface StepInfo {
    id: Step;
    label: string;
    number: number;
}

const STEPS: StepInfo[] = [
    { id: 'upload', label: 'Upload', number: 1 },
    { id: 'source-lang', label: 'Source', number: 2 },
    { id: 'transcribe', label: 'Transcribe', number: 3 },
    { id: 'edit', label: 'Edit', number: 4 },
    { id: 'voice', label: 'Voice', number: 5 },
    { id: 'complete', label: 'Complete', number: 6 },
];

interface StepIndicatorProps {
    currentStep: Step;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
    const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

    return (
        <div className="flex items-center justify-center gap-2 flex-wrap">
            {STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isActive = step.id === currentStep;

                return (
                    <div key={step.id} className="flex items-center gap-2">
                        <div
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all duration-300",
                                isActive && "bg-card shadow-md ring-1 ring-border",
                                !isActive && "opacity-60"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold transition-all duration-300",
                                    isCompleted && "bg-primary text-primary-foreground",
                                    isActive && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                                    !isCompleted && !isActive && "bg-muted text-muted-foreground"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <span>{step.number}</span>
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-sm font-semibold transition-all duration-300",
                                    isActive && "text-foreground",
                                    !isActive && "text-muted-foreground"
                                )}
                            >
                                {step.label}
                            </span>
                        </div>

                        {index < STEPS.length - 1 && (
                            <div
                                className={cn(
                                    "w-8 h-0.5 transition-all duration-300",
                                    isCompleted ? "bg-primary" : "bg-border"
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default StepIndicator;
