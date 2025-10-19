import { useState, useEffect } from "react";
import {BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { AccessibilityBar } from "./components/AccessibilityBar";
import { Dashboard } from "./components/Dashboard";
import { UploadPage } from "./components/UploadPage";
import { TestRecordingsPage } from "./components/TestRecordingsPage";
import { ProcessingScreen } from "./components/ProcessingScreen";
import { AudioPlayer } from "./components/AudioPlayer";
import { SettingsPage } from "./components/SettingsPage";
import { PastLessons } from "./components/PastLessons";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";

type ProcessingStage = "uploading" | "ocr" | "synthesis";

interface Upload {
  id: string;
  userId: string;
  type: string;
  filePath: string;
  originalName: string;
  createdAt: string;
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

  const [isDyslexiaFont, setIsDyslexiaFont] = useState(() => {
    // Load saved preference from localStorage
    const saved = localStorage.getItem('stemvoice-dyslexia-font');
    return saved ? JSON.parse(saved) : false;
  });
  const [isContrastMode, setIsContrastMode] = useState(false);
  const [highlightAsSpoken, setHighlightAsSpoken] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [textSpacing, setTextSpacing] = useState(1.0);

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const mockUploads: Upload[] = [
    { id: "upload-1", userId: "user-123", type: "PDF", filePath: "/storage/calculus_lecture.pdf", originalName: "Calculus_Lecture_5.pdf", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: "upload-2", userId: "user-123", type: "PDF", filePath: "/storage/chemistry_notes.pdf", originalName: "Chemistry_Chapter3.pdf", createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { id: "upload-3", userId: "user-123", type: "video", filePath: "/storage/physics_lecture.mp4", originalName: "Physics_Lecture_Oct15.mp4", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "upload-4", userId: "user-123", type: "audio", filePath: "/storage/study_discussion.mp3", originalName: "Study_Group_Discussion.mp3", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "upload-5", userId: "user-123", type: "math_image", filePath: "/storage/quadratic_formula.jpg", originalName: "Quadratic_Formula.jpg", createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
    { id: "upload-6", userId: "user-123", type: "math_image", filePath: "/storage/integration_problems.png", originalName: "Integration_Problems.png", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  const mockExtractedContent: Record<string, string> = {
    "upload-1": `# Calculus Lecture 5: Derivatives and Applications

## Key Concepts

The derivative of a function represents the instantaneous rate of change. For a function f(x), the derivative f'(x) is defined as:

f'(x) = lim(h→0) [f(x+h) - f(x)] / h

### Common Derivatives
- Power Rule: d/dx(x^n) = nx^(n-1)
- Product Rule: d/dx[f(x)g(x)] = f'(x)g(x) + f(x)g'(x)
- Chain Rule: d/dx[f(g(x))] = f'(g(x)) · g'(x)

### Applications
1. Finding maximum and minimum values
2. Optimization problems
3. Related rates
4. Motion and velocity calculations

## Example Problems

Problem 1: Find the derivative of f(x) = 3x^2 + 5x - 7
Solution: f'(x) = 6x + 5

Problem 2: A particle moves along a line with position s(t) = t^3 - 6t^2 + 9t. Find when the velocity is zero.
Solution: v(t) = s'(t) = 3t^2 - 12t + 9 = 0, solving gives t = 1 or t = 3`,

    "upload-2": `# Chemistry Chapter 3: Chemical Bonding

## Introduction to Chemical Bonds

Chemical bonds are forces that hold atoms together in molecules and compounds. There are three main types:

### 1. Ionic Bonds
- Form between metals and nonmetals
- Electrons are transferred from one atom to another
- Result in charged ions (cations and anions)
- Example: NaCl (sodium chloride)

### 2. Covalent Bonds
- Form between nonmetals
- Electrons are shared between atoms
- Can be single, double, or triple bonds
- Example: H2O (water), CO2 (carbon dioxide)

### 3. Metallic Bonds
- Form between metal atoms
- Electrons are delocalized in a "sea of electrons"
- Give metals their characteristic properties

## Electronegativity and Bond Polarity

Electronegativity is the ability of an atom to attract electrons in a bond. Differences in electronegativity determine bond type:
- Difference > 1.7: Ionic bond
- Difference 0.4-1.7: Polar covalent bond
- Difference < 0.4: Nonpolar covalent bond

## Lewis Structures
Rules for drawing Lewis structures:
1. Count total valence electrons
2. Draw skeletal structure
3. Complete octets (except H which needs 2)
4. Place remaining electrons on central atom
5. Form multiple bonds if needed`,

    "upload-3": `# Physics Lecture - October 15: Kinematics

## Motion in One Dimension

### Key Equations
- Velocity: v = Δx/Δt
- Acceleration: a = Δv/Δt
- Position with constant acceleration: x = x₀ + v₀t + ½at²
- Velocity with constant acceleration: v = v₀ + at
- Velocity squared: v² = v₀² + 2a(x - x₀)

### Free Fall
Objects in free fall experience constant acceleration due to gravity:
- g = 9.8 m/s² (downward)
- Initial velocity determines trajectory
- Air resistance is negligible for dense objects

## Vector Components
For motion at an angle θ:
- Horizontal component: vₓ = v cos(θ)
- Vertical component: vᵧ = v sin(θ)
- Magnitude: v = √(vₓ² + vᵧ²)

## Projectile Motion
- Horizontal motion: constant velocity (no acceleration)
- Vertical motion: constant acceleration (-g)
- Maximum height occurs when vᵧ = 0
- Range depends on initial velocity and angle

### Example Problem
A ball is thrown horizontally from a 20m tall building at 15 m/s. When does it hit the ground?

Using y = y₀ + v₀t + ½at²:
0 = 20 + 0 - ½(9.8)t²
t = √(40/9.8) ≈ 2.02 seconds`,

    "upload-4": `# Study Group Discussion - Organic Chemistry

[Transcribed from audio recording]

**Sarah:** Okay, so let's review the main points from Chapter 5 on stereochemistry.

**Mike:** Right, so stereoisomers are molecules with the same molecular formula and connectivity but different spatial arrangements.

**Sarah:** Exactly. And there are two main types - enantiomers and diastereomers.

**Mike:** Enantiomers are like mirror images that aren't superimposable, right? Like your left and right hands.

**Sarah:** Perfect analogy! They have opposite configurations at all chiral centers. And they rotate plane-polarized light in opposite directions.

**Mike:** What about diastereomers?

**Sarah:** Those are stereoisomers that aren't mirror images. They have different physical and chemical properties, unlike enantiomers which have identical properties except for optical rotation.

**Mike:** Can you give an example?

**Sarah:** Sure! Think about 2,3-dibromobutane. It has two chiral centers, so it can have multiple stereoisomers. The (R,R) and (S,S) forms are enantiomers of each other, and the (R,S) form is a diastereomer to both.

**Mike:** That makes sense. What about the meso compounds?

**Sarah:** Good question! A meso compound has chiral centers but an internal plane of symmetry, so it's achiral overall. It's its own mirror image.

**Mike:** Oh, like tartaric acid?

**Sarah:** Exactly! You're getting it. Should we move on to naming conventions?`,

    "upload-5": `# Quadratic Formula

The quadratic formula is used to solve equations of the form:

ax² + bx + c = 0

where a ≠ 0.

## The Formula

x = [-b ± √(b² - 4ac)] / (2a)

## Discriminant

The discriminant Δ = b² - 4ac determines the nature of the roots:

- If Δ > 0: Two distinct real roots
- If Δ = 0: One repeated real root (or two identical roots)
- If Δ < 0: Two complex conjugate roots

## Example

Solve: 2x² - 5x + 2 = 0

Here, a = 2, b = -5, c = 2

Δ = (-5)² - 4(2)(2) = 25 - 16 = 9

x = [5 ± √9] / (2·2) = [5 ± 3] / 4

Therefore:
x₁ = (5 + 3)/4 = 2
x₂ = (5 - 3)/4 = 0.5

The solutions are x = 2 and x = 0.5`,

    "upload-6": `# Integration Problems - Practice Set

## Fundamental Theorem of Calculus

∫[a,b] f(x)dx = F(b) - F(a)

where F'(x) = f(x)

## Basic Integration Rules

1. Power Rule: ∫x^n dx = (x^(n+1))/(n+1) + C, for n ≠ -1

2. Constant Multiple: ∫kf(x)dx = k∫f(x)dx

3. Sum Rule: ∫[f(x) + g(x)]dx = ∫f(x)dx + ∫g(x)dx

4. Exponential: ∫e^x dx = e^x + C

5. Natural Log: ∫(1/x)dx = ln|x| + C

## Practice Problems

### Problem 1
Evaluate: ∫(3x² + 2x - 5)dx

Solution:
= x³ + x² - 5x + C

### Problem 2
Evaluate: ∫[0,2] (x² + 1)dx

Solution:
F(x) = (x³/3) + x
F(2) - F(0) = (8/3 + 2) - (0) = 14/3

### Problem 3
Find the area under y = x² from x = 0 to x = 3

Solution:
Area = ∫[0,3] x²dx = [x³/3]₀³ = 27/3 - 0 = 9 square units

### Problem 4 (Integration by Substitution)
Evaluate: ∫2x(x² + 1)⁵dx

Let u = x² + 1, then du = 2x dx

∫u⁵du = (u⁶/6) + C = [(x² + 1)⁶]/6 + C`
  };

  const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b67fdaad`;

  useEffect(() => {
    document.body.classList.toggle("dyslexia-font", isDyslexiaFont);
    document.body.classList.toggle("contrast-mode", isContrastMode);
    document.body.style.letterSpacing = `${(textSpacing - 1) * 0.05}em`;
    
    // Force font family change with inline styles for maximum override
    if (isDyslexiaFont) {
      document.body.style.fontFamily = "'Comic Sans MS', 'Trebuchet MS', 'Verdana', cursive, sans-serif";
      document.body.style.borderTop = "4px solid #10B981";
      document.body.style.backgroundColor = "#f0f9ff";
      
      // Apply to all elements
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.fontFamily = "'Comic Sans MS', 'Trebuchet MS', 'Verdana', cursive, sans-serif";
          el.style.letterSpacing = "0.08em";
        }
      });
    } else {
      document.body.style.fontFamily = '';
      document.body.style.borderTop = '';
      document.body.style.backgroundColor = '';
      
      // Reset all elements
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.fontFamily = '';
          el.style.letterSpacing = '';
        }
      });
    }
    
    // Save dyslexia font preference to localStorage
    localStorage.setItem('stemvoice-dyslexia-font', JSON.stringify(isDyslexiaFont));
    
    // Debug logging
    console.log('Dyslexia font toggled:', isDyslexiaFont);
    console.log('Body classes:', document.body.className);
  }, [isDyslexiaFont, isContrastMode, textSpacing]);

  useEffect(() => {
    loadLessons();
  }, []);

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

  const handleUpload = async (file: File) => {
    try {
      navigate("/processing");
      setProcessingStage("uploading");

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${publicAnonKey}` },
        body: formData,
      });

      if (!uploadResponse.ok) {
        toast.error("Failed to upload file. Please try again.");
        navigate("/upload");
        return;
      }

      const uploadData = await uploadResponse.json();

      setProcessingStage("ocr");
      const ocrResponse = await fetch(`${API_BASE}/process-ocr`, {
        method: "POST",
        headers: { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: uploadData.fileUrl }),
      });

      if (!ocrResponse.ok) {
        toast.error("Failed to process content. Please try again.");
        navigate("/upload");
        return;
      }

      const ocrData = await ocrResponse.json();
      if (ocrData.isDemo) toast.info("Using demo mode - API credentials not configured");

      setProcessingStage("synthesis");
      const synthesisResponse = await fetch(`${API_BASE}/synthesize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: ocrData.extractedText, voiceSpeed }),
      });

      if (!synthesisResponse.ok) {
        toast.error("Failed to generate audio. Please try again.");
        navigate("/upload");
        return;
      }

      const synthesisData = await synthesisResponse.json();
      if (synthesisData.isDemo) toast.info("Using demo audio - API credentials not configured");

      const lessonTitle = uploadData.originalName || "Untitled Lesson";
      const saveResponse = await fetch(`${API_BASE}/save-lesson`, {
        method: "POST",
        headers: { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonTitle,
          extractedText: ocrData.extractedText,
          mathContent: ocrData.mathContent,
          audioUrl: synthesisData.audioUrl,
        }),
      });

      if (!saveResponse.ok) console.error("Failed to save lesson:", await saveResponse.text());

      const saveData = await saveResponse.json();

      setCurrentLesson(saveData.lesson);
      navigate("/player");

      await loadLessons();
      toast.success("Lesson created successfully!");
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      navigate("/upload");
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
        onToggleDyslexiaFont={() => {
          const newState = !isDyslexiaFont;
          setIsDyslexiaFont(newState);
          toast.success(
            newState 
              ? "Dyslexia-friendly font enabled" 
              : "Dyslexia-friendly font disabled",
            {
              description: newState 
                ? "Using OpenDyslexic font with improved spacing" 
                : "Switched back to default font"
            }
          );
        }}
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

          <Route 
            path="/test-recordings" 
            element={<TestRecordingsPage />} 
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
