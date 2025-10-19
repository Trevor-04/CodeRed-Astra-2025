import { useState, useEffect } from "react";
import {BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { AccessibilityBar } from "./components/AccessibilityBar";
import { Dashboard } from "./components/Dashboard";
import { UploadPage } from "./components/UploadPage";
import { ProcessingScreen } from "./components/ProcessingScreen";
import { AudioPlayer } from "./components/AudioPlayer";
import { SettingsPage } from "./components/SettingsPage";
import { PastLessons } from "./components/PastLessons";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import * as pdfjsLib from 'pdfjs-dist';
import { mockExtractedContent } from "./data/mockContent";

// Configure PDF.js worker with proper Vite handling
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

type ProcessingStage = "uploading" | "ocr" | "synthesis";

// Hardcoded user ID for development
const CURRENT_USER_ID = "123e4567-e89b-12d3-a456-426614174000";
const API_BASE_URL = "http://localhost:3000/api";

interface Upload {
  id: string;
  userId: string;
  type: string;
  filePath: string;
  originalName: string;
  createdAt: string;
  parsedText?: string;
}

interface Lesson {
  id: string;
  title: string;
  date: string;
  audioUrl: string;
  extractedText: string;
  mathContent: string;
}

function AppContent() {
  const navigate = useNavigate();
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("uploading");

  const [isDyslexiaFont, setIsDyslexiaFont] = useState(false);
  const [isContrastMode, setIsContrastMode] = useState(false);
  const [highlightAsSpoken, setHighlightAsSpoken] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [textSpacing, setTextSpacing] = useState(1.0);

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // Load uploads from database
  const [mockUploads, setMockUploads] = useState<Upload[]>([]);


  useEffect(() => {
    document.body.classList.toggle("dyslexia-font", isDyslexiaFont);
    document.body.classList.toggle("contrast-mode", isContrastMode);
    document.body.style.letterSpacing = `${(textSpacing - 1) * 0.05}em`;
  }, [isDyslexiaFont, isContrastMode, textSpacing]);

  useEffect(() => {
    loadLessons();
    loadUploads();
  }, []);

  // Log mock data state for debugging
  useEffect(() => {
    console.log("📦 Mock Uploads State:", mockUploads);
    console.log("📄 Mock Extracted Content State:", mockExtractedContent);
    console.log("📊 Total Uploads:", mockUploads.length);
    mockUploads.forEach((upload) => {
      console.log(`\n${upload.originalName}:`, {
        id: upload.id,
        type: upload.type,
        hasContent: !!upload.parsedText,
        contentLength: upload.parsedText?.length || 0,
        contentPreview: upload.parsedText?.substring(0, 100) + "..."
      });
    });
  }, [mockUploads]);

  const loadUploads = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/${CURRENT_USER_ID}`);
      if (!response.ok) {
        console.error("Failed to load uploads");
        return;
      }
      const data = await response.json();
      
      // Transform Supabase data to match our Upload interface
      const uploads: Upload[] = (data.uploads || []).map((upload: any) => ({
        id: upload.id,
        userId: upload.user_id,
        type: upload.type,
        filePath: upload.file_path,
        originalName: upload.original_name,
        createdAt: upload.created_at,
        parsedText: upload.parsed_text,
      }));
      
      setMockUploads(uploads);
      console.log("✅ Loaded uploads from database:", uploads.length);
    } catch (error) {
      console.error("Error loading uploads:", error);
    }
  };

  const loadLessons = async () => {
    try {
      const response = await fetch(`${API_BASE}/lessons`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setLessons(data.lessons || []);
    } catch (error) {
      console.error("Error loading lessons:", error);
    }
  };

  // Extract text from PDF using PDF.js
  const extractPdfText = async (file: File): Promise<string> => {
    try {
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      console.log(`📊 PDF has ${pdf.numPages} pages`);
      
      let fullText = "";
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText;
      }
      
      
      console.log(`✅ PDF extraction complete: ${fullText.length} characters extracted`);
      return fullText;
      
    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      throw new Error(`Failed to extract PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to parse file content with PDF.js support
const parseFileContent = async (file: File, rawOnly: boolean = false): Promise<string> => {
  try {
    // PDF handling
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const pdfText = await extractPdfText(file);
      return rawOnly ? cleanPdfText(pdfText) : pdfText;
    }

    // Non-PDF
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result;
        if (!result) return reject(new Error('No result from FileReader'));

        if (rawOnly && typeof result === 'string') {
          return resolve(result.trim());
        }

        // Otherwise return your formatted output...
        resolve(formatStructuredContent(file, result));
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  } catch (err) {
    console.error('Error in parseFileContent:', err);
    throw err;
  }
};

  const handleUpload = async (file: File) => {
    try {
      console.log("📦 File details:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });
      
      toast.info(`Processing ${file.name}...`);

      // Parse the file content
      const parsedText = await parseFileContent(file);
      
      // Log detailed parse information
      console.log("PARSED TEXT", parsedText);

      // Determine file type
      let fileType = "PDF";
      if (file.type.includes('image')) {
        fileType = "math_image";
      } else if (file.type.includes('video')) {
        fileType = "video";
      } else if (file.type.includes('audio')) {
        fileType = "audio";
      } else if (file.type.includes('text')) {
        fileType = "PDF"; // Keep as PDF for now to match existing UI
      }

      // Create new upload object (id will be auto-generated by Supabase)
      const newUpload = {
        userId: CURRENT_USER_ID,
        type: fileType,
        filePath: `/storage/${file.name}`,
        originalName: file.name,
        createdAt: new Date().toISOString(),
        parsedText: parsedText,
      };

      // Send newUpload to backend API
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newUpload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Failed to upload: ${errorData.error || response.statusText}`);
        return;
      }

      // Reload uploads from database to get the latest data
      await loadUploads();
      
      
      toast.success(`${file.name} uploaded successfully!`);
      
      // Stay on upload page so user can see the new file in the list
      // No navigation needed - the file will appear in Recent Uploads

    } catch (error) {
      console.error("❌ Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to process file: ${errorMessage}`);
    }
  };

  const handlePlayLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    navigate("/player");
  };

  const handleDeleteLesson = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/lessons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      if (!response.ok) {
        toast.error("Failed to delete lesson. Please try again.");
        return;
      }

      await loadLessons();
      toast.success("Lesson deleted successfully");
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white">
      <Header />

      <AccessibilityBar
        isDyslexiaFont={isDyslexiaFont}
        isContrastMode={isContrastMode}
        voiceSpeed={voiceSpeed}
        onToggleDyslexiaFont={() => setIsDyslexiaFont(!isDyslexiaFont)}
        onToggleContrastMode={() => setIsContrastMode(!isContrastMode)}
        onVoiceSpeedChange={setVoiceSpeed}
        onOpenSettings={() => navigate("/settings")}
      />

      <div id="main-content">
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard onNavigate={(screen) => navigate(`/${screen === "dashboard" ? "" : screen}`)} />
            } 
          />

          <Route 
            path="/upload" 
            element={
              <UploadPage
                onBack={() => navigate("/")}
                onUpload={handleUpload}
                mockUploads={mockUploads}
                mockExtractedContent={mockExtractedContent}
              />
            } 
          />

          <Route 
            path="/processing" 
            element={<ProcessingScreen stage={processingStage} />} 
          />

          <Route 
            path="/player" 
            element={
              currentLesson ? (
                <AudioPlayer
                  audioUrl={currentLesson.audioUrl}
                  extractedText={currentLesson.extractedText}
                  mathContent={currentLesson.mathContent}
                  lessonId={currentLesson.id}
                  highlightAsSpoken={highlightAsSpoken}
                  onBack={() => navigate("/")}
                />
              ) : (
                <Navigate to="/lessons" replace />
              )
            } 
          />

          <Route 
            path="/settings" 
            element={
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
                onBack={() => navigate("/")}
              />
            } 
          />

          <Route 
            path="/lessons" 
            element={
              <PastLessons
                lessons={lessons}
                onPlayLesson={handlePlayLesson}
                onDeleteLesson={handleDeleteLesson}
                onBack={() => navigate("/")}
              />
            } 
          />
        </Routes>
      </div>

      <footer
        className="bg-white border-t border-[#E2E8F0] py-8 lg:py-12 mt-16 lg:mt-20 shadow-sm"
        role="contentinfo"
      >
        <div className="container mx-auto px-6 lg:px-12 text-center text-[#64748B] max-w-[1200px]">
          <p className="text-lg lg:text-xl mb-2 text-[#0F172A]">
            <strong>STEMVoice</strong> — Empowering inclusive learning for every mind
          </p>
          <p className="text-base mt-3">Powered by Mathpix OCR + ElevenLabs Voice AI</p>
        </div>
      </footer>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
