import { Play, Pause, RotateCcw, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useState, useEffect, useRef } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  extractedText: string;
  mathContent: string;
  lessonId: string;
  highlightAsSpoken: boolean;
  onBack: () => void;
}

export function AudioPlayer({ 
  audioUrl, 
  extractedText, 
  mathContent, 
  lessonId,
  highlightAsSpoken,
  onBack 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [highlightedWord, setHighlightedWord] = useState(-1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Word-by-word highlight sync with audio as per guidelines
  useEffect(() => {
    if (highlightAsSpoken && isPlaying) {
      const words = extractedText.split(' ');
      const wordIndex = Math.floor((currentTime / duration) * words.length);
      setHighlightedWord(wordIndex);
    } else {
      setHighlightedWord(-1);
    }
  }, [currentTime, duration, isPlaying, highlightAsSpoken, extractedText]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Keyboard shortcuts: space = play/pause
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        togglePlay();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderHighlightedText = () => {
    const words = extractedText.split(' ');
    return words.map((word, index) => (
      <span
        key={index}
        className={`transition-all duration-150 ${
          highlightAsSpoken && index === highlightedWord
            ? 'bg-[#2563EB] text-white px-1 rounded'
            : ''
        }`}
      >
        {word}{' '}
      </span>
    ));
  };

  return (
    <main className="container mx-auto px-6 lg:px-12 py-6 lg:py-12 max-w-[1200px]" role="main">
      <Button
        onClick={onBack}
        className="cursor-pointer mb-8 min-h-[48px] px-6 bg-white text-[#1D4ED8] border-2 border-[#1D4ED8] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200"
        aria-label="Go back to dashboard"
      >
        ← Back to Dashboard
      </Button>

      <h2 className="text-3xl lg:text-4xl mb-8 lg:mb-12 text-center text-[#0F172A]">Your Lesson is Ready!</h2>

      {/* Audio Player Card */}
      <Card className="bg-white border-[#E2E8F0] shadow-md mb-8 rounded-lg">
        <CardContent className="p-8 lg:p-12">
          <div className="flex flex-col items-center gap-8">
            {/* Waveform visualization */}
            <div className="flex gap-1 lg:gap-1.5 items-end h-24 lg:h-32 w-full max-w-md" aria-hidden="true">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition-all duration-150 ${
                    isPlaying ? 'bg-[#3B82F6]' : 'bg-[#E2E8F0]'
                  }`}
                  style={{
                    height: `${Math.random() * 60 + 40}%`,
                    opacity: isPlaying && i < (currentTime / duration) * 50 ? 1 : 0.3,
                  }}
                ></div>
              ))}
            </div>

            {/* Large central play/pause button - 64px as per guidelines */}
            <Button
              onClick={togglePlay}
              className="cursor-pointer w-16 h-16 lg:w-24 lg:h-24 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center p-0"
              aria-label={isPlaying ? 'Pause audio - Press Space' : 'Play audio - Press Space'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 lg:w-12 lg:h-12" aria-hidden="true" />
              ) : (
                <Play className="w-8 h-8 lg:w-12 lg:h-12 ml-1" aria-hidden="true" />
              )}
            </Button>

            {/* Progress bar */}
            <div className="w-full max-w-md px-4 lg:px-0">
              <div className="flex justify-between text-base mb-3 text-[#0F172A]">
                <span aria-live="polite">{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="w-full h-2 lg:h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] transition-all duration-150"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={currentTime}
                  aria-valuemin={0}
                  aria-valuemax={duration}
                  aria-label="Audio playback progress"
                ></div>
              </div>
            </div>

            {/* Controls - Secondary button style */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
              <Button
                onClick={restart}
                className="cursor-pointer gap-2 min-h-[48px] px-6 bg-white text-[#1D4ED8] border-2 border-[#1D4ED8] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200"
                aria-label="Restart audio from beginning"
              >
                <RotateCcw className="w-5 h-5" aria-hidden="true" />
                Restart
              </Button>
              <Button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = audioUrl;
                  a.download = `lesson-${lessonId}.mp3`;
                  a.click();
                }}
                className="cursor-pointer gap-2 min-h-[48px] px-6 bg-white text-[#1D4ED8] border-2 border-[#1D4ED8] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200"
                aria-label="Download audio file"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                Download
              </Button>
            </div>
          </div>

          <audio ref={audioRef} src={audioUrl} className="hidden" />
        </CardContent>
      </Card>

      {/* Math Content Card */}
      {mathContent && (
        <Card className="bg-[#F8FAFC] border-[#E2E8F0] shadow-md mb-8 rounded-lg">
          <CardHeader className="p-6 lg:p-8">
            <CardTitle className="text-2xl lg:text-3xl text-[#0F172A]">Math Content</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl lg:text-4xl text-center py-12 px-4 text-[#0F172A]">
            {mathContent}
          </CardContent>
        </Card>
      )}

      {/* Extracted Text Card */}
      <Card className="bg-white border-[#E2E8F0] shadow-md rounded-lg">
        <CardHeader className="p-6 lg:p-8">
          <CardTitle className="text-2xl lg:text-3xl text-[#0F172A]">Extracted Text</CardTitle>
        </CardHeader>
        <CardContent className="text-lg lg:text-xl leading-relaxed text-left p-6 lg:p-8 pt-0 text-[#0F172A]">
          {renderHighlightedText()}
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-base text-[#64748B]">
        <p>Powered by Mathpix OCR + ElevenLabs Voice AI</p>
      </div>
    </main>
  );
}