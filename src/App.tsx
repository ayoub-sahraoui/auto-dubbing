import { useState, useCallback } from 'react';
import {
  VideoUploader,
  LanguageSelector,
  SourceLanguageSelector,
  TranscriptEditor,
  ProcessingStatus,
  DownloadPanel,
  StepIndicator,
  IconSparkles
} from './components';
import type { SourceLanguage } from './components';
import { useUpload, useJob } from './hooks';
import { api } from './api';
import type { Language, Voice, TranscriptSegment } from './api';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle } from 'lucide-react';

type Step = 'upload' | 'source-lang' | 'transcribe' | 'edit' | 'voice' | 'complete';

export default function App() {
  // State
  const [step, setStep] = useState<Step>('upload');
  const [jobId, setJobId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [, setSourceLanguage] = useState<SourceLanguage | null>(null);
  const [, setSelectedLanguage] = useState<Language | null>(null);
  const [, setSelectedVoice] = useState<Voice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingVoice, setGeneratingVoice] = useState(false);

  // Hooks
  const { upload, uploading, progress: uploadProgress } = useUpload();
  const { job, refetch, startPolling } = useJob(jobId, {
    onStatusChange: (status) => {
      // Auto-advance steps based on status
      if (status === 'transcribed') {
        loadTranscript();
        setStep('edit');
      }
      if (status === 'voice_generated') {
        // Don't change generatingVoice to false - keep showing processing UI
        handleMerge();
      }
      if (status === 'merging') {
        // Explicitly keep the processing state while merging
        setGeneratingVoice(true);
      }
      if (status === 'completed') {
        setGeneratingVoice(false);
        setStep('complete');
      }
      if (status === 'failed') {
        setGeneratingVoice(false);
      }
    },
    onError: (err) => {
      setGeneratingVoice(false);
      setError(err);
    }
  });

  // Load transcript when transcription is complete
  const loadTranscript = useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await api.getTranscript(jobId);
      setTranscript(data.segments);
    } catch (err) {
      setError('Failed to load transcript');
    }
  }, [jobId]);

  // Handle video upload
  const handleUpload = useCallback(async (file: File) => {
    setError(null);
    try {
      const response = await upload(file);
      setJobId(response.job_id);
      setStep('source-lang');
    } catch (_err) {
      setError(_err instanceof Error ? _err.message : 'Upload failed');
    }
  }, [upload]);

  // Handle source language selection
  const handleSourceLanguageSelect = useCallback(async (language: SourceLanguage | null) => {
    if (!jobId) return;
    setError(null);
    setSourceLanguage(language);

    try {
      // Start transcription with selected language
      await api.startTranscription(jobId, language?.code);
      setStep('transcribe');
      // Start polling and refetch to get updated status
      await refetch();
      startPolling();
    } catch (_err) {
      setError('Failed to start transcription');
    }
  }, [jobId, refetch, startPolling]);

  // Handle transcript confirmation
  const handleTranscriptConfirm = useCallback(async () => {
    if (!jobId) return;
    setError(null);

    try {
      // Save any edits
      await api.updateTranscript(jobId, transcript);
      setStep('voice');
    } catch (_err) {
      setError('Failed to save transcript');
    }
  }, [jobId, transcript]);

  // Handle voice generation
  const handleVoiceSelect = useCallback(async (language: Language, voice: Voice) => {
    if (!jobId) return;
    setError(null);
    setSelectedLanguage(language);
    setSelectedVoice(voice);
    setGeneratingVoice(true);

    try {
      await api.generateVoice(jobId, language.code, voice.id);
      // Start polling and refetch to get updated status
      await refetch();
      startPolling();
    } catch (_err) {
      setGeneratingVoice(false);
      setError('Failed to start voice generation');
    }
  }, [jobId, refetch, startPolling]);

  // Handle video merge
  const handleMerge = useCallback(async () => {
    if (!jobId) return;
    try {
      await api.mergeVideo(jobId);
      // Start polling and refetch to get updated status
      await refetch();
      startPolling();
    } catch (_err) {
      setError('Failed to start video merge');
    }
  }, [jobId, refetch, startPolling]);

  // Reset everything
  const handleReset = useCallback(() => {
    setStep('upload');
    setJobId(null);
    setTranscript([]);
    setSourceLanguage(null);
    setSelectedLanguage(null);
    setSelectedVoice(null);
    setError(null);
  }, []);

  // Check if we're in a processing state
  const isProcessing = generatingVoice || (job && ['uploading', 'transcribing', 'generating_voice', 'merging'].includes(job.status));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all" />
                <div className="relative w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 transition-all group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/30">
                  <IconSparkles size={22} className="text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">AutoDub</h1>
                <p className="text-xs text-muted-foreground font-medium">AI Video Dubbing</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="max-w-4xl mx-auto mb-12">
          <StepIndicator currentStep={step} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step Content */}
        <div className="max-w-5xl mx-auto">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto text-center">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight">
                  Upload Your Video
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Select a video to automatically dub with AI-generated voiceover. We support most common video formats.
                </p>
              </div>

              <Card className="border-2">
                <VideoUploader
                  onUpload={handleUpload}
                  disabled={uploading}
                />
              </Card>

              {uploading && (
                <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <Spinner className="h-6 w-6" />
                    <span className="font-semibold text-lg">Uploading video...</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2 text-right font-mono">{uploadProgress}%</p>
                </Card>
              )}
            </div>
          )}

          {/* Source Language Selection Step */}
          {step === 'source-lang' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto text-center">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight">
                  Source Language
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  What language is spoken in your video? Accurately selecting this helps improve transcription quality.
                </p>
              </div>
              <SourceLanguageSelector onSelect={handleSourceLanguageSelect} />
            </div>
          )}

          {/* Transcription Step */}
          {step === 'transcribe' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto text-center">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight">
                  Transcribing Audio
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  AI is analyzing and transcribing the speech in your video. This creates the foundation for the dub.
                </p>
              </div>
              <Card className="p-8">
                <ProcessingStatus job={job} />
              </Card>
            </div>
          )}

          {/* Edit Transcript Step */}
          {step === 'edit' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight">
                  Review Transcript
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Edit the transcribed text before generating the voiceover. Use this chance to correct any mistakes.
                </p>
              </div>
              <Card className="p-0 overflow-hidden">
                <TranscriptEditor
                  segments={transcript}
                  onChange={setTranscript}
                  onConfirm={handleTranscriptConfirm}
                />
              </Card>
            </div>
          )}

          {/* Voice Selection Step */}
          {step === 'voice' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto text-center">
              {isProcessing ? (
                <>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold tracking-tight">
                      Generating Voiceover
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Creating your dubbed video with the selected voice. This involves synthesis and synchronization.
                    </p>
                  </div>
                  <Card className="p-8">
                    <ProcessingStatus job={job} />
                  </Card>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold tracking-tight">
                      Select Voice
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Choose the target language and a voice that matches your video's tone.
                    </p>
                  </div>
                  <LanguageSelector onSelect={handleVoiceSelect} />
                </>
              )}
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && job && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto text-center">
              <div className="space-y-4 mb-10">
                <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Dubbing Complete!
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Your video has been successfully dubbed. Download it below.
                </p>
              </div>
              <Card className="p-8">
                <DownloadPanel job={job} onReset={handleReset} />
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
