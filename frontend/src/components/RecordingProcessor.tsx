import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  FileText, 
  Upload, 
  Play, 
  Pause, 
  Volume2, 
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  FileAudio,
  FileVideo
} from 'lucide-react';
import { AudioProcessingService } from '../services/audioProcessingService';
import { SpeechToTextService } from '../services/speechToTextService';
import { UploadService } from '../services/uploadService';
import { useAuth } from '../contexts/AuthContext';
import type { AudioExtractionProgress } from '../services/audioProcessingService';
import type { TranscriptionProgress, TranscriptionResult } from '../services/speechToTextService';

interface ProcessingState {
  stage: 'idle' | 'audio-processing' | 'transcribing' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

interface RecordingProcessorProps {
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function RecordingProcessor({ 
  onTranscriptionComplete, 
  onError,
  className = ''
}: RecordingProcessorProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    stage: 'idle',
    progress: 0,
    message: ''
  });
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioProcessingService = AudioProcessingService.getInstance();
  const speechToTextService = SpeechToTextService.getInstance();

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTranscriptionResult(null);
      setProcessingState({ stage: 'idle', progress: 0, message: '' });
      
      // Create audio URL for playback
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTranscriptionResult(null);
      setProcessingState({ stage: 'idle', progress: 0, message: '' });
      
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // Process the selected file
  const processFile = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setProcessingState({
        stage: 'audio-processing',
        progress: 0,
        message: 'Starting audio processing...'
      });

      // Validate file
      const validation = speechToTextService.validateAudioFile(selectedFile);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Extract/process audio
      const audioBlob = await audioProcessingService.processAudioFile(
        selectedFile,
        (progress: AudioExtractionProgress) => {
          setProcessingState({
            stage: 'audio-processing',
            progress: Math.round(progress.progress * 0.5), // First half of overall progress
            message: progress.message
          });
        }
      );

      // Transcribe audio
      setProcessingState({
        stage: 'transcribing',
        progress: 50,
        message: 'Starting transcription...'
      });

      const result = await (speechToTextService.isConfigured() 
        ? speechToTextService.transcribeAudio(
            audioBlob,
            { language: 'en', optimizeForAccuracy: true },
            (progress: TranscriptionProgress) => {
              setProcessingState({
                stage: 'transcribing',
                progress: Math.round(50 + (progress.progress * 0.5)), // Second half of progress
                message: progress.message
              });
            }
          )
        : speechToTextService.mockTranscription(
            audioBlob,
            (progress: TranscriptionProgress) => {
              setProcessingState({
                stage: 'transcribing',
                progress: Math.round(50 + (progress.progress * 0.5)),
                message: `${progress.message} (Demo Mode)`
              });
            }
          )
      );

      setTranscriptionResult(result);
      setProcessingState({
        stage: 'complete',
        progress: 100,
        message: 'Transcription completed successfully!'
      });

      // Save the upload to the database
      try {
        if (user?.id) {
          await UploadService.saveUpload({
            id: crypto.randomUUID(),
            userId: user.id,
            type: selectedFile.type.startsWith('video/') ? 'video' : 'audio',
            filePath: selectedFile.name, // In a real app, this would be the actual file path in storage
            originalName: selectedFile.name,
            parsedText: result.text,
          });
          console.log('Upload saved to database successfully');
        } else {
          console.warn('No user ID available, skipping database save');
        }
      } catch (saveError) {
        console.error('Failed to save upload to database:', saveError);
        // Don't show error to user since transcription succeeded
      }

      onTranscriptionComplete?.(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProcessingState({
        stage: 'error',
        progress: 0,
        message: 'Processing failed',
        error: errorMessage
      });
      onError?.(errorMessage);
    }
  }, [selectedFile, speechToTextService, audioProcessingService, onTranscriptionComplete, onError, user?.id]);

  // Audio playback controls
  const togglePlayback = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Download transcript
  const downloadTranscript = useCallback(() => {
    if (!transcriptionResult) return;

    const content = `Transcription Result
================

File: ${selectedFile?.name}
Date: ${new Date(transcriptionResult.timestamp).toLocaleString()}
Duration: ${transcriptionResult.duration}s
Confidence: ${Math.round(transcriptionResult.confidence * 100)}%
Language: ${transcriptionResult.language}

Transcript:
${transcriptionResult.text}

${transcriptionResult.chunks ? `
Detailed Transcript with Timestamps:
${transcriptionResult.chunks.map(chunk => 
  `[${chunk.timestamp[0]}s - ${chunk.timestamp[1]}s] ${chunk.text}`
).join('\n')}
` : ''}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${transcriptionResult.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [transcriptionResult, selectedFile]);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setTranscriptionResult(null);
    setProcessingState({ stage: 'idle', progress: 0, message: '' });
    setIsPlaying(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [audioUrl]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* File Upload Area */}
      {!selectedFile && (
        <div 
          className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          role="button"
          tabIndex={0}
          aria-label="Drop files here or click to browse"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-purple-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 mb-2">
                Upload Audio or Video File
              </p>
              <p className="text-gray-600 mb-4">
                Drag and drop your file here or click browse to select
              </p>
              <p className="text-sm text-gray-500">
                Supports: MP3, WAV, MP4, MOV, WebM (max 100MB)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileSelect}
              className="sr-only"
              id="file-upload"
              aria-describedby="file-upload-description"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-purple-500 cursor-pointer hover:bg-purple-600 text-white px-6 py-3 text-lg"
              aria-describedby="file-upload-description"
            >
              <FileText className="w-5 h-5 mr-2" aria-hidden="true" />
              Browse Files
            </Button>
          </div>
        </div>
      )}

      {/* Selected File Display */}
      {selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {selectedFile.type.startsWith('video/') ? (
                <FileVideo className="w-6 h-6 text-purple-600" aria-hidden="true" />
              ) : (
                <FileAudio className="w-6 h-6 text-purple-600" aria-hidden="true" />
              )}
              <span>{selectedFile.name}</span>
              <Badge variant="outline" className="ml-auto">
                {audioProcessingService.getFileSize(selectedFile.size)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Type: {selectedFile.type}</span>
              <span>Size: {audioProcessingService.getFileSize(selectedFile.size)}</span>
              <span>Est. processing: {audioProcessingService.getEstimatedProcessingTime(selectedFile)}</span>
            </div>

            {/* Audio Player (if available) */}
            {audioUrl && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Button
                  onClick={togglePlayback}
                  variant="outline"
                  size="sm"
                  className="w-10 h-10 p-0"
                  aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Play className="w-4 h-4" aria-hidden="true" />
                  )}
                </Button>
                <Volume2 className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <span className="text-sm text-gray-600">Preview audio</span>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="sr-only"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={processFile}
                disabled={processingState.stage !== 'idle'}
                className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
              >
                {processingState.stage === 'idle' ? (
                  <>
                    <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                    Start Transcription
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Processing...
                  </>
                )}
              </Button>
              <Button
                onClick={reset}
                variant="outline"
                disabled={processingState.stage === 'audio-processing' || processingState.stage === 'transcribing'}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Display */}
      {(processingState.stage === 'audio-processing' || processingState.stage === 'transcribing') && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {processingState.stage === 'audio-processing' ? 'Processing Audio' : 'Transcribing'}
                </span>
                <span className="text-sm text-gray-600">{processingState.progress}%</span>
              </div>
              <Progress value={processingState.progress} className="w-full" />
              <p className="text-sm text-gray-600" role="status" aria-live="polite">
                {processingState.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {processingState.stage === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            <strong>Processing Error:</strong> {processingState.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success and Transcript Display */}
      {processingState.stage === 'complete' && transcriptionResult && (
        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
            <AlertDescription className="text-green-800">
              Transcription completed successfully! Confidence: {Math.round(transcriptionResult.confidence * 100)}%
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transcript</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {transcriptionResult.duration}s duration
                  </Badge>
                  <Badge variant="outline">
                    {transcriptionResult.language.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main transcript with accessibility features */}
              <div 
                className="p-4 bg-gray-50 rounded-lg border"
                role="region"
                aria-label="Transcript content"
              >
                <p 
                  className="text-lg leading-relaxed font-medium text-gray-900"
                  style={{ 
                    fontSize: '1.125rem', 
                    lineHeight: '1.75',
                    fontFamily: 'system-ui, -apple-system, sans-serif' 
                  }}
                >
                  {transcriptionResult.text}
                </p>
              </div>

              {/* Detailed chunks with timestamps */}
              {transcriptionResult.chunks && transcriptionResult.chunks.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer font-medium text-purple-600 hover:text-purple-700">
                    View detailed transcript with timestamps
                  </summary>
                  <div className="mt-3 space-y-2">
                    {transcriptionResult.chunks.map((chunk, index) => (
                      <div 
                        key={index}
                        className="flex gap-3 p-2 hover:bg-gray-50 rounded"
                      >
                        <span className="text-xs text-gray-500 min-w-[80px] font-mono">
                          {Math.floor(chunk.timestamp[0])}:{String(Math.floor(chunk.timestamp[0] % 60)).padStart(2, '0')}
                        </span>
                        <span className="text-gray-800">{chunk.text}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={downloadTranscript}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                  Download Transcript
                </Button>
                <Button
                  onClick={reset}
                  variant="outline"
                >
                  Process Another File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}