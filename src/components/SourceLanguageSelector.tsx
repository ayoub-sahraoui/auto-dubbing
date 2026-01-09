import { useState } from 'react';
import { Search, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface SourceLanguage {
    code: string;
    name: string;
    nativeName: string;
}

interface SourceLanguageSelectorProps {
    onSelect: (language: SourceLanguage | null) => void;
}

// Common languages supported by Whisper
const COMMON_LANGUAGES: SourceLanguage[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
];

export function SourceLanguageSelector({ onSelect }: SourceLanguageSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [, setSelectedLang] = useState<SourceLanguage | null>(null);

    const filteredLanguages = COMMON_LANGUAGES.filter(
        (lang) =>
            lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lang.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (language: SourceLanguage | null) => {
        setSelectedLang(language);
        // Immediately proceed to transcription
        onSelect(language);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Auto-detect option */}
            <Card
                className="p-6 cursor-pointer border-2 transition-all hover:border-primary hover:shadow-lg group"
                onClick={() => handleSelect(null)}
            >
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 blur-md group-hover:blur-lg transition-all" />
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Zap className="w-6 h-6 text-primary-foreground" />
                        </div>
                    </div>
                    <div className="text-left flex-1">
                        <div className="font-bold text-lg mb-1">Auto-Detect</div>
                        <div className="text-sm text-muted-foreground">
                            Automatically detect the language (slower)
                        </div>
                    </div>
                </div>
            </Card>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search languages..."
                    className="pl-10 h-12"
                />
            </div>

            {/* Language list */}
            <ScrollArea className="h-[400px] rounded-lg border p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                    {filteredLanguages.map((lang) => (
                        <Card
                            key={lang.code}
                            className={cn(
                                "p-4 cursor-pointer border transition-all hover:border-primary hover:shadow-md group",
                                "flex items-center justify-between"
                            )}
                            onClick={() => handleSelect(lang)}
                        >
                            <div>
                                <div className="font-semibold group-hover:text-primary transition-colors">
                                    {lang.name}
                                </div>
                                <div className="text-sm text-muted-foreground">{lang.nativeName}</div>
                            </div>
                            <Badge variant="secondary" className="ml-2">
                                {lang.code}
                            </Badge>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
