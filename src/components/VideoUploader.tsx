import { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, Film, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoUploaderProps {
    onUpload: (file: File) => void;
    disabled?: boolean;
    maxSizeMB?: number;
}

const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
const ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

export function VideoUploader({ onUpload, disabled = false, maxSizeMB = 500 }: VideoUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = useCallback((file: File): string | null => {
        // Check type
        if (!ALLOWED_TYPES.includes(file.type)) {
            const ext = '.' + file.name.split('.').pop()?.toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(ext)) {
                return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
            }
        }

        // Check size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            return `File too large. Maximum size: ${maxSizeMB}MB`;
        }

        return null;
    }, [maxSizeMB]);

    const handleFile = useCallback((file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setSelectedFile(file);

        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    }, [validateFile]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    }, [disabled, handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleClick = useCallback(() => {
        if (!disabled && !selectedFile) {
            fileInputRef.current?.click();
        }
    }, [disabled, selectedFile]);

    const handleRemove = useCallback(() => {
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [previewUrl]);

    const handleConfirm = useCallback(() => {
        if (selectedFile) {
            onUpload(selectedFile);
        }
    }, [selectedFile, onUpload]);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.join(',')}
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled}
            />

            {!selectedFile ? (
                <div
                    onClick={handleClick}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                        "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
                        "hover:border-primary hover:bg-primary/5 hover:scale-[1.01]",
                        isDragging && "border-primary bg-primary/10 scale-[1.02]",
                        disabled && "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent hover:scale-100"
                    )}
                >
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
                            <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                                <Upload className="w-10 h-10 text-primary" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xl font-semibold">
                                Drop your video here
                            </p>
                            <p className="text-base text-muted-foreground">
                                or click to browse files
                            </p>
                        </div>

                        <Badge variant="secondary" className="text-sm px-4 py-2">
                            Supported: MP4, WebM, MOV, AVI, MKV • Max {maxSizeMB}MB
                        </Badge>
                    </div>
                </div>
            ) : (
                <div className="p-6">
                    <div className="flex items-start gap-6">
                        {/* Video Preview */}
                        <div className="w-48 h-28 rounded-xl overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border">
                            {previewUrl && (
                                <video
                                    src={previewUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    onMouseEnter={(e) => e.currentTarget.play()}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.pause();
                                        e.currentTarget.currentTime = 0;
                                    }}
                                />
                            )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0 py-2">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 space-y-1">
                                    <p className="font-semibold text-lg truncate">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatFileSize(selectedFile.size)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRemove}
                                    className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <Badge variant="outline" className="border-primary/50 bg-primary/5">
                                    <Film className="w-3 h-3 mr-1" />
                                    <span>Ready to process</span>
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-8">
                        <Button
                            variant="outline"
                            onClick={handleRemove}
                            className="flex-1"
                        >
                            Choose Different File
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={disabled}
                            className="flex-1"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    );
}

export default VideoUploader;
