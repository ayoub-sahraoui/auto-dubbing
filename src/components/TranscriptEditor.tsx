import { useState, useCallback, useMemo, useEffect } from 'react';
import type { TranscriptSegment } from '../api';
import { Edit, Check, FileText, List, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TranscriptEditorProps {
    segments: TranscriptSegment[];
    onChange: (segments: TranscriptSegment[]) => void;
    onConfirm: () => void;
    disabled?: boolean;
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export function TranscriptEditor({ segments, onChange, onConfirm, disabled = false }: TranscriptEditorProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<string>('segments');
    const [srtText, setSrtText] = useState<string>('');

    // Convert segments to SRT format
    const segmentsToSRT = useMemo(() => {
        return segments.map((seg, index) => {
            const lines = [];
            lines.push((index + 1).toString());
            lines.push(`${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}`);
            lines.push(seg.text);
            lines.push('');
            return lines.join('\n');
        }).join('\n');
    }, [segments]);

    // Update SRT text when segments change
    useEffect(() => {
        setSrtText(segmentsToSRT);
    }, [segmentsToSRT]);

    // Initialize SRT text on mount
    useEffect(() => {
        setSrtText(segmentsToSRT);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSrtTextChange = useCallback((text: string) => {
        setSrtText(text);
    }, []);

    const copySrtToClipboard = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(srtText);
            // You could add a toast notification here
        } catch (err) {
            console.error('Failed to copy SRT:', err);
        }
    }, [srtText]);

    const handleTextChange = useCallback((id: number, text: string) => {
        const updated = segments.map((seg) =>
            seg.id === id ? { ...seg, text } : seg
        );
        onChange(updated);
    }, [segments, onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            setEditingId(null);
        }
        if (e.key === 'Escape') {
            setEditingId(null);
        }
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                                <Edit size={20} className="text-primary" />
                            </div>
                            <div>
                                <CardTitle>Transcript Editor</CardTitle>
                                <CardDescription>Review and edit the transcribed text</CardDescription>
                            </div>
                        </div>
                        <Badge variant="secondary">
                            {segments.length} segment{segments.length !== 1 ? 's' : ''}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="segments" className="gap-2">
                                <List size={16} />
                                Segments
                            </TabsTrigger>
                            <TabsTrigger value="srt" className="gap-2">
                                <FileText size={16} />
                                SRT Format
                            </TabsTrigger>
                        </TabsList>

                        {/* Segments Tab */}
                        <TabsContent value="segments" className="space-y-2">
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                                {segments.map((segment) => (
                                    <div
                                        key={segment.id}
                                        className={cn(
                                            "group transition-all duration-200 border rounded-xl p-3",
                                            editingId === segment.id ? 'bg-accent border-primary' : 'border-transparent hover:border-border hover:shadow-sm'
                                        )}
                                        onClick={() => !disabled && setEditingId(segment.id)}
                                    >
                                        <div className="flex gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs font-mono">
                                                {formatTime(segment.start)}
                                            </Badge>
                                            <span className="text-muted-foreground">→</span>
                                            <Badge variant="outline" className="text-xs font-mono">
                                                {formatTime(segment.end)}
                                            </Badge>
                                        </div>

                                        <div className="flex-1 w-full relative">
                                            {editingId === segment.id ? (
                                                <Textarea
                                                    value={segment.text}
                                                    onChange={(e) => handleTextChange(segment.id, e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    onBlur={() => setEditingId(null)}
                                                    autoFocus
                                                    disabled={disabled}
                                                    className="min-h-[80px]"
                                                    placeholder="Enter text..."
                                                />
                                            ) : (
                                                <p className="text-base leading-relaxed py-1 px-2 cursor-text rounded hover:bg-muted/50 transition-colors">
                                                    {segment.text || <span className="text-muted-foreground italic">Empty segment</span>}
                                                </p>
                                            )}
                                        </div>

                                        {!disabled && editingId !== segment.id && (
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-lg absolute right-2 top-2">
                                                <Edit size={16} className="text-muted-foreground" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* SRT Format Tab */}
                        <TabsContent value="srt" className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Standard SRT subtitle format with timestamps. Copy this to use in video players or subtitle editors.
                                    </p>
                                    <Button
                                        onClick={copySrtToClipboard}
                                        disabled={disabled}
                                        size="sm"
                                        variant="secondary"
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy SRT
                                    </Button>
                                </div>
                                <Textarea
                                    value={srtText}
                                    onChange={(e) => handleSrtTextChange(e.target.value)}
                                    disabled={disabled}
                                    className="min-h-[500px] font-mono text-sm"
                                    placeholder="SRT format will appear here..."
                                    readOnly
                                />
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Subtitles: {segments.length}</span>
                                    <span>•</span>
                                    <span>Characters: {srtText.length}</span>
                                    <span>•</span>
                                    <span>Format: SubRip (.srt)</span>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                        <p className="text-sm text-muted-foreground mb-1">Total Duration</p>
                        <p className="text-2xl font-bold">
                            {segments.length > 0
                                ? formatTime(segments[segments.length - 1].end)
                                : '00:00.00'
                            }
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                        <p className="text-sm text-muted-foreground mb-1">Word Count</p>
                        <p className="text-2xl font-bold">
                            {segments.reduce((acc, seg) => acc + seg.text.split(/\s+/).filter(Boolean).length, 0)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                        <p className="text-sm text-muted-foreground mb-1">Characters</p>
                        <p className="text-2xl font-bold">
                            {segments.reduce((acc, seg) => acc + seg.text.length, 0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Button
                onClick={onConfirm}
                disabled={disabled || segments.length === 0}
                size="lg"
                className="w-full text-lg shadow-lg hover:shadow-xl transition-all"
            >
                <Check className="mr-2 h-5 w-5" />
                Confirm Transcript
            </Button>
        </div>
    );
}

export default TranscriptEditor;
