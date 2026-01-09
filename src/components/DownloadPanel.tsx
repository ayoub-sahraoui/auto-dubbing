import type { Job } from '../api';
import { api } from '../api';
import { Download, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DownloadPanelProps {
    job: Job;
    onReset: () => void;
}

export function DownloadPanel({ job, onReset }: DownloadPanelProps) {
    const handleDownloadVideo = () => {
        window.open(api.getDownloadUrl(job.job_id), '_blank');
    };

    const handleDownloadSrt = () => {
        window.open(api.getSrtDownloadUrl(job.job_id), '_blank');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Success Header */}
            <div className="text-center py-12 bg-gradient-to-br from-primary/10 to-accent rounded-3xl border">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-card flex items-center justify-center shadow-lg ring-4 ring-primary/10 transition-transform hover:scale-105 duration-300">
                    <Check size={48} className="text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-3">
                    Your Video is Ready!
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    The dubbing process has been completed successfully. You can now download your files.
                </p>
            </div>

            {/* Download Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Video Download */}
                <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary" onClick={handleDownloadVideo}>
                    <CardContent className="p-6">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Download size={32} className="text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">Download Video</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Dubbed video with new voiceover
                                </p>
                                <Badge variant="secondary" className="font-bold">
                                    MP4 FORMAT
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* SRT Download */}
                <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-orange-500" onClick={handleDownloadSrt}>
                    <CardContent className="p-6">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Download size={32} className="text-orange-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-1 group-hover:text-orange-500 transition-colors">Download Subtitles</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Transcription as subtitle file
                                </p>
                                <Badge variant="secondary" className="font-bold">
                                    SRT FORMAT
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Video Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Video Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-4 rounded-xl bg-muted/50 border">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Original File</p>
                            <p className="font-semibold truncate" title={job.video_filename}>{job.video_filename}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50 border">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Language</p>
                            <p className="font-semibold">{job.transcript?.language || 'Auto-detected'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create Another */}
            <div className="text-center pt-4">
                <Button
                    onClick={onReset}
                    variant="outline"
                    size="lg"
                    className="px-8"
                >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Dub Another Video
                </Button>
            </div>
        </div>
    );
}

export default DownloadPanel;
