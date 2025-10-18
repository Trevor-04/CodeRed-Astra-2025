import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AccessibilityBar } from './components/AccessibilityBar';
import { Dashboard } from './components/Dashboard';
import { UploadArea } from './components/uploadArea';
import { ProcessingScreen } from './components/ProcessingScreen';
import { AudioPlayer } from './components/AudioPlayer';
import { SettingsPage } from './components/SettingsPage';
import { PastLessons } from './components/PastLessons';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

type Screen = 'dashboard' | 'upload' | 'processing' | 'player' | 'settings' | 'lessons';
type ProcessingStage = 'uploading' | 'ocr' | 'synthesis';

interface Lesson {
  id: string;
  title: string;
  date: string;
  audioUrl: string;
  extractedText: string;
  mathContent: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('uploading');
  
  // Accessibility settings
  const [isDyslexiaFont, setIsDyslexiaFont] = useState(false);
  const [isContrastMode, setIsContrastMode] = useState(false);
  const [highlightAsSpoken, setHighlightAsSpoken] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [textSpacing, setTextSpacing] = useState(1.0);

  // Current lesson data
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b67fdaad`;

  // Apply accessibility settings to body
  useEffect(() => {
    if (isDyslexiaFont) {
      document.body.classList.add('dyslexia-font');
    } else {
      document.body.classList.remove('dyslexia-font');
    }

    if (isContrastMode) {
      document.body.classList.add('contrast-mode');
    } else {
      document.body.classList.remove('contrast-mode');
    }

    document.body.style.letterSpacing = `${(textSpacing - 1) * 0.05}em`;
  }, [isDyslexiaFont, isContrastMode, textSpacing]);

  // Load lessons on mount
  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const response = await fetch(`${API_BASE}/lessons`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        console.error('Failed to load lessons:', await response.text());
        return;
      }

      const data = await response.json();
      setLessons(data.lessons || []);
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setCurrentScreen('processing');
      setProcessingStage('uploading');

      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        console.error('Upload error:', error);
        toast.error('Failed to upload file. Please try again.');
        setCurrentScreen('upload');
        return;
      }

      const uploadData = await uploadResponse.json();
      
      // Process OCR
      setProcessingStage('ocr');
      const ocrResponse = await fetch(`${API_BASE}/process-ocr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileUrl: uploadData.fileUrl })
      });

      if (!ocrResponse.ok) {
        const error = await ocrResponse.text();
        console.error('OCR error:', error);
        toast.error('Failed to process content. Please try again.');
        setCurrentScreen('upload');
        return;
      }

      const ocrData = await ocrResponse.json();

      if (ocrData.isDemo) {
        toast.info('Using demo mode - API credentials not configured');
      }

      // Synthesize speech
      setProcessingStage('synthesis');
      const synthesisResponse = await fetch(`${API_BASE}/synthesize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text: ocrData.extractedText,
          voiceSpeed 
        })
      });

      if (!synthesisResponse.ok) {
        const error = await synthesisResponse.text();
        console.error('Synthesis error:', error);
        toast.error('Failed to generate audio. Please try again.');
        setCurrentScreen('upload');
        return;
      }

      const synthesisData = await synthesisResponse.json();

      if (synthesisData.isDemo) {
        toast.info('Using demo audio - API credentials not configured');
      }

      // Save lesson
      const lessonTitle = uploadData.originalName || 'Untitled Lesson';
      const saveResponse = await fetch(`${API_BASE}/save-lesson`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: lessonTitle,
          extractedText: ocrData.extractedText,
          mathContent: ocrData.mathContent,
          audioUrl: synthesisData.audioUrl
        })
      });

      if (!saveResponse.ok) {
        console.error('Failed to save lesson:', await saveResponse.text());
      }

      const saveData = await saveResponse.json();
      
      // Show lesson
      setCurrentLesson(saveData.lesson);
      setCurrentScreen('player');
      
      // Reload lessons list
      await loadLessons();

      toast.success('Lesson created successfully!');

    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setCurrentScreen('upload');
    }
  };

  const handlePlayLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setCurrentScreen('player');
  };

  const handleDeleteLesson = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/lessons/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        console.error('Failed to delete lesson:', await response.text());
        toast.error('Failed to delete lesson. Please try again.');
        return;
      }

      await loadLessons();
      toast.success('Lesson deleted successfully');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white">
      {/* Skip to main content link for screen readers */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />

      <AccessibilityBar
        isDyslexiaFont={isDyslexiaFont}
        isContrastMode={isContrastMode}
        voiceSpeed={voiceSpeed}
        onToggleDyslexiaFont={() => setIsDyslexiaFont(!isDyslexiaFont)}
        onToggleContrastMode={() => setIsContrastMode(!isContrastMode)}
        onVoiceSpeedChange={setVoiceSpeed}
        onOpenSettings={() => setCurrentScreen('settings')}
      />

      <div id="main-content">
        {currentScreen === 'dashboard' && (
          <Dashboard onNavigate={(screen: string) => setCurrentScreen(screen as Screen)} />
        )}

        {currentScreen === 'upload' && (
          <UploadArea
            onUpload={handleUpload}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'processing' && (
          <ProcessingScreen stage={processingStage} />
        )}

        {currentScreen === 'player' && currentLesson && (
          <AudioPlayer
            audioUrl={currentLesson.audioUrl}
            extractedText={currentLesson.extractedText}
            mathContent={currentLesson.mathContent}
            lessonId={currentLesson.id}
            highlightAsSpoken={highlightAsSpoken}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsPage
            isDyslexiaFont={isDyslexiaFont}
            isContrastMode={isContrastMode}
            highlightAsSpoken={highlightAsSpoken}
            voiceSpeed={voiceSpeed}
            textSpacing={textSpacing}
            onToggleDyslexiaFont={() => setIsDyslexiaFont(!isDyslexiaFont)}
            onToggleContrastMode={() => setIsContrastMode(!isContrastMode)}
            onToggleHighlightAsSpoken={() => setHighlightAsSpoken(!highlightAsSpoken)}
            onVoiceSpeedChange={setVoiceSpeed}
            onTextSpacingChange={setTextSpacing}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'lessons' && (
          <PastLessons
            lessons={lessons}
            onPlayLesson={handlePlayLesson}
            onDeleteLesson={handleDeleteLesson}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}
      </div>

      <footer className="bg-white border-t border-[#E2E8F0] py-8 lg:py-12 mt-16 lg:mt-20 shadow-sm" role="contentinfo">
        <div className="container mx-auto px-6 lg:px-12 text-center text-[#64748B] max-w-[1200px]">
          <p className="text-lg lg:text-xl mb-2 text-[#0F172A]">
            <strong>STEMVoice</strong> — Empowering inclusive learning for every mind
          </p>
          <p className="text-base mt-3">
            Powered by Mathpix OCR + ElevenLabs Voice AI
          </p>
        </div>
      </footer>

      <Toaster position="top-center" richColors />
    </div>
  );
}