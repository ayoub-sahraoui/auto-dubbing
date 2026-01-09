import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Language, Voice } from '../api';
import { Globe, Volume2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
    onSelect: (language: Language, voice: Voice) => void;
    disabled?: boolean;
}

// Voice avatar emoji based on gender and index
const getVoiceEmoji = (voice: Voice, index: number): string => {
    const femaleEmojis = ['👩', '👧', '👩‍🦰', '👩‍🦱', '🧕'];
    const maleEmojis = ['👨', '🧔', '👨‍🦱', '👨‍🦰', '🧑'];
    const emojis = voice.gender === 'Female' ? femaleEmojis : maleEmojis;
    return emojis[index % emojis.length];
};

export function LanguageSelector({ onSelect, disabled = false }: LanguageSelectorProps) {
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
    const [speed, setSpeed] = useState([1.0]);

    useEffect(() => {
        loadLanguages();
    }, []);

    const loadLanguages = async () => {
        try {
            setLoading(true);
            const response = await api.getLanguages();
            setLanguages(response.languages);

            // Default to first language
            if (response.languages.length > 0) {
                setSelectedLanguage(response.languages[0]);
                if (response.languages[0].voices.length > 0) {
                    setSelectedVoice(response.languages[0].voices[0]);
                }
            }
        } catch (_err) {
            setError('Failed to load available voices');
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (lang: Language) => {
        setSelectedLanguage(lang);
        // Auto-select first voice
        if (lang.voices.length > 0) {
            setSelectedVoice(lang.voices[0]);
        }
    };

    const handleConfirm = () => {
        if (selectedLanguage && selectedVoice) {
            onSelect(selectedLanguage, selectedVoice);
        }
    };

    if (loading) {
        return (
            <Card className="p-12">
                <div className="flex flex-col items-center gap-4">
                    <Spinner className="h-10 w-10" />
                    <p className="text-muted-foreground font-medium">Loading languages...</p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-12">
                <div className="flex flex-col items-center gap-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button onClick={loadLanguages} variant="outline">
                        Retry
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Language Selection */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                            <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Target Language</CardTitle>
                            <CardDescription>Select the language for your dubbed video</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang)}
                                disabled={disabled}
                                className={cn(
                                    "p-4 rounded-xl border-2 transition-all text-left group hover:shadow-md",
                                    selectedLanguage?.code === lang.code
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border hover:border-primary/50 hover:bg-accent'
                                )}
                            >
                                <span className={cn(
                                    "block font-bold mb-1.5",
                                    selectedLanguage?.code === lang.code ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                                )}>
                                    {lang.name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                    {lang.voices.length} voice{lang.voices.length !== 1 ? 's' : ''}
                                </Badge>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Voice Selection */}
            {selectedLanguage && (
                <Card className="animate-in slide-in-from-bottom-4 duration-300">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center ring-1 ring-orange-500/20">
                                <Volume2 className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <CardTitle>Voice</CardTitle>
                                <CardDescription>Choose a voice for the narration</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {selectedLanguage.voices.map((voice, index) => (
                                <button
                                    key={voice.id}
                                    onClick={() => setSelectedVoice(voice)}
                                    disabled={disabled}
                                    className={cn(
                                        "p-4 rounded-xl border-2 transition-all flex items-center gap-3 text-left group hover:shadow-md",
                                        selectedVoice?.id === voice.id
                                            ? 'border-orange-500 bg-orange-500/5 shadow-sm'
                                            : 'border-border hover:border-orange-500/50 hover:bg-accent'
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-card border flex items-center justify-center text-2xl shadow-sm">
                                        {getVoiceEmoji(voice, index)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "font-bold truncate",
                                            selectedVoice?.id === voice.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                                        )}>
                                            {voice.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase font-medium">
                                            {voice.gender}
                                        </p>
                                    </div>
                                    {selectedVoice?.id === voice.id && (
                                        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-sm">
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Speed Control */}
            <Card className="animate-in slide-in-from-bottom-4 duration-300">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Speech Speed</CardTitle>
                            <CardDescription>Adjust how fast the voice speaks</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-lg font-mono font-bold px-4">
                            {speed[0].toFixed(1)}x
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Slider
                            value={speed}
                            onValueChange={setSpeed}
                            min={0.5}
                            max={2.0}
                            step={0.1}
                            disabled={disabled}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs font-semibold text-muted-foreground uppercase">
                            <span>Slow (0.5x)</span>
                            <span>Normal (1.0x)</span>
                            <span>Fast (2.0x)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Confirm Button */}
            <Button
                onClick={handleConfirm}
                disabled={disabled || !selectedLanguage || !selectedVoice}
                className="w-full py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                size="lg"
            >
                Generate Voice
            </Button>
        </div>
    );
}

export default LanguageSelector;
