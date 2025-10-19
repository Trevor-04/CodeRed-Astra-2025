import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { AnimatedBackground } from "./AnimatedBackground";
import {
  Send,
  FileText,
  Image as ImageIcon,
  Video,
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  Zap,
} from "lucide-react";

// ... keep all your interfaces the same ...

interface Upload {
  id: string;
  userId: string;
  type: string;
  filePath: string;
  originalName: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  shouldSpeak?: boolean;
}

interface WorkspaceProps {
  upload: Upload;
  extractedContent: string;
  onClose?: () => void;
}

export function Workspace({
  upload,
  extractedContent,
  onClose,
}: WorkspaceProps) {
  // ... keep all your existing state ...
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hi! I've analyzed "${upload.originalName}". I can help you understand the content, create summaries, generate quizzes, or answer any questions you have!`,
      timestamp: new Date().toISOString(),
      shouldSpeak: true,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenMessageId = useRef<string>("");
  
  // NEW: 3D Background toggle
  const [show3DBackground, setShow3DBackground] = useState(false);

  // ... keep ALL your existing useEffects and functions exactly as they are ...
  
  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        toggleVoiceInput();
      }
      else if (e.ctrlKey && !e.altKey && !e.shiftKey && e.key === 'Control') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening]);

  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (
      lastMessage?.role === 'assistant' && 
      lastMessage.shouldSpeak && 
      !currentAudio &&
      lastMessage.id !== lastSpokenMessageId.current
    ) {
      lastSpokenMessageId.current = lastMessage.id;
      speakText(lastMessage.content);
    }
  }, [chatMessages, currentAudio]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const callAIBackend = async (endpoint: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/ai/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractedContent }),
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('AI Error:', error);
      return { error: 'Failed to get AI response' };
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = async (text: string, autoAdvanceQuiz: boolean = false) => {
    try {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }

      const response = await fetch('http://localhost:3000/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('TTS failed:', errorData);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      audio.play();

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };
    } catch (error) {
      console.error('TTS Error:', error);
    }
  };

  const latexToReadable = (text: string): string => {
    return text
      .replace(/\$/g, '')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
      .replace(/\\sum/g, 'sum of')
      .replace(/\\int/g, 'integral of')
      .replace(/\^(\d+)/g, ' to the power of $1')
      .replace(/\^{([^}]+)}/g, ' to the power of $1')
      .replace(/_(\d+)/g, ' subscript $1')
      .replace(/_{([^}]+)}/g, ' subscript $1')
      .replace(/\\bar\{([^}]+)\}/g, '$1 bar')
      .replace(/\\sigma/g, 'sigma')
      .replace(/\\pi/g, 'pi')
      .replace(/\\theta/g, 'theta')
      .replace(/\\alpha/g, 'alpha')
      .replace(/\\beta/g, 'beta')
      .replace(/\\/g, '');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (quizMode) {
      handleQuizAnswer(inputMessage);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setChatMessages([...chatMessages, userMessage]);
    const currentInput = inputMessage;
    setInputMessage("");

    let endpoint = "explain";
    if (currentInput.toLowerCase().includes("summary") || currentInput.toLowerCase().includes("summarize")) {
      endpoint = "summary";
    } else if (currentInput.toLowerCase().includes("quiz")) {
      endpoint = "quiz";
    }

    const data = await callAIBackend(endpoint);
    
    let aiResponse = "";
    if (data.error) {
      aiResponse = "Sorry, I encountered an error. Please try again.";
    } else {
      aiResponse = data.summary || data.quiz || data.explanation || "Here's what I found...";
    }

    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: aiResponse,
      timestamp: new Date().toISOString(),
      shouldSpeak: true,
    };
    
    setChatMessages((prev) => [...prev, aiMessage]);
  };

  const handleQuiz = async () => {
    setIsLoading(true);
    const data = await callAIBackend('quiz');
    
    if (data.questions && Array.isArray(data.questions)) {
      const questions = data.questions;
      
      if (questions.length > 0) {
        setQuizMode(true);
        setCurrentQuizQuestions(questions);
        setQuizAnswers([]);
        setCurrentQuestionIndex(0);
        
        const firstQuestion = `Question 1: ${questions[0]}`;
        const message: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: firstQuestion,
          timestamp: new Date().toISOString(),
          shouldSpeak: true,
        };
        
        setChatMessages((prev) => [...prev, message]);
      }
    } else {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I couldn't generate quiz questions. Please try again.",
        timestamp: new Date().toISOString(),
        shouldSpeak: true,
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    }
    
    setIsLoading(false);
  };

  const askNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < currentQuizQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      
      const nextQuestion = `Question ${nextIndex + 1}: ${currentQuizQuestions[nextIndex]}`;
      const message: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: nextQuestion,
        timestamp: new Date().toISOString(),
        shouldSpeak: true,
      };
      
      setChatMessages((prev) => [...prev, message]);
    } else {
      evaluateQuizAnswers();
    }
  };

  const handleQuizAnswer = async (answer: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: answer,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    const newAnswers = [...quizAnswers, answer];
    setQuizAnswers(newAnswers);

    if (currentQuestionIndex >= currentQuizQuestions.length - 1) {
      const finalAnswers = [...newAnswers];
      setQuizMode(false);
      
      try {
        const response = await fetch('http://localhost:3000/api/ai/evaluate-quiz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quiz_questions: currentQuizQuestions,
            user_answers: finalAnswers,
            original_content: extractedContent,
          }),
        });

        const data = await response.json();
        
        const evaluationMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: data.evaluation || "Great job completing the quiz!",
          timestamp: new Date().toISOString(),
          shouldSpeak: true,
        };
        setChatMessages((prev) => [...prev, evaluationMessage]);
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: "Quiz completed! Great job answering all the questions.",
          timestamp: new Date().toISOString(),
          shouldSpeak: true,
        };
        setChatMessages((prev) => [...prev, errorMessage]);
      }
    } else {
      const feedback: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Got it! Let me ask the next question.",
        timestamp: new Date().toISOString(),
        shouldSpeak: true,
      };
      setChatMessages((prev) => [...prev, feedback]);
      
      setTimeout(() => {
        askNextQuestion();
      }, 1500);
    }
  };

  const evaluateQuizAnswers = async () => {
    // Handled in handleQuizAnswer
  };

  const handleSummary = async () => {
    setIsLoading(true);
    const data = await callAIBackend('summary');
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: data.summary || "Here's a summary of the content...",
      timestamp: new Date().toISOString(),
      shouldSpeak: true,
    };
    
    setChatMessages((prev) => [...prev, message]);
  };

  const handleExplain = async () => {
    setIsLoading(true);
    const data = await callAIBackend('explain');
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: data.explanation || "Let me explain the key concepts...",
      timestamp: new Date().toISOString(),
      shouldSpeak: true,
    };
    
    setChatMessages((prev) => [...prev, message]);
  };

  const handleReadAloud = () => {
    const readableText = latexToReadable(extractedContent);
    speakText(readableText);
  };

  const getFileIcon = () => {
    if (upload.type.includes("math") || upload.type.includes("image"))
      return <ImageIcon className="w-5 h-5" />;
    if (upload.type.includes("video") || upload.type.includes("audio"))
      return <Video className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className={`space-y-4 relative ${show3DBackground ? "mode-3d" : ""}`}>
      {/* NEW: 3D Animated Background */}
      {show3DBackground && <AnimatedBackground />}

      {/* All content with z-index to stay above background */}
      <div className="relative z-10">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onClose} className="gap-2">
            ← Back to Uploads
          </Button>
          
          {/* NEW: 3D Background Toggle */}
          <Button
            variant={show3DBackground ? "default" : "outline"}
            onClick={() => setShow3DBackground(!show3DBackground)}
            className={`gap-2 ${show3DBackground ? "!bg-cyan-600 !text-white hover:!bg-cyan-700" : ""}`}
          >
            <Zap className="w-4 h-4" />
            {show3DBackground ? '3D Mode ON' : '3D Mode OFF'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - File Content */}
          <Card className={show3DBackground ? "bg-black/80 backdrop-blur-sm border-cyan-500/30" : ""}>
            <CardHeader className="border-b">
              <CardTitle className={`flex items-center gap-2 ${show3DBackground ? "text-cyan-100" : ""}`}>
                {getFileIcon()}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {upload.originalName}
                  </div>
                  <div className="text-sm text-gray-500 font-normal">
                    {upload.type} • Uploaded{" "}
                    {new Date(upload.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className={`h-[500px] overflow-y-auto p-6 ${show3DBackground ? "text-cyan-50" : ""}`}>
                <div className="prose prose-sm max-w-none">
                  <h3 className={`text-lg font-semibold mb-4 ${show3DBackground ? "text-cyan-100" : "text-gray-900"}`}>
                    Extracted Content
                  </h3>
                  {extractedContent.split("\n\n").map((paragraph, index) => (
                    <p key={index} className={`mb-4 leading-relaxed ${show3DBackground ? "text-cyan-50" : "text-gray-700"}`}>
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                {/* Read Aloud Button */}
                <div className="mt-6 pt-4 border-t">
                  <Button
                    onClick={handleReadAloud}
                    variant="outline"
                    className="w-full gap-2"
                    disabled={!!currentAudio}
                  >
                    <Volume2 className="w-4 h-4" />
                    {currentAudio ? 'Playing...' : 'Read Content Aloud (with Math)'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right side - AI Chat */}
          <Card className={`flex flex-col ${show3DBackground ? "bg-black/80 backdrop-blur-sm border-cyan-500/30" : ""}`}>
            <CardHeader className="border-b">
              <CardTitle className={`flex items-center gap-2 ${show3DBackground ? "text-cyan-100" : ""}`}>
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Assistant
                {quizMode && (
                  <span className="text-sm font-normal text-purple-600">
                    (Quiz Mode - Question {currentQuestionIndex + 1}/{currentQuizQuestions.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-[500px]">
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.role === "user"
                            ? show3DBackground 
                              ? "bg-cyan-600/80 text-white backdrop-blur-sm" 
                              : "bg-indigo-600 text-white"
                            : show3DBackground
                              ? "bg-gray-900/80 text-cyan-50 backdrop-blur-sm"
                              : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p
                            className={`text-xs ${
                              message.role === "user"
                                ? show3DBackground ? "text-cyan-200" : "text-indigo-200"
                                : show3DBackground ? "text-cyan-400" : "text-gray-500"
                            }`}
                          >
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                          {message.role === "assistant" && (
                            <button
                              onClick={() => speakText(message.content, false)}
                              className="ml-2 text-xs flex items-center gap-1 hover:underline"
                              disabled={!!currentAudio}
                            >
                              <Volume2 className="w-3 h-3" />
                              Listen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className={`rounded-lg p-3 ${show3DBackground ? "bg-gray-900/80 text-cyan-50 backdrop-blur-sm" : "bg-gray-100 text-gray-900"}`}>
                        <p className="text-sm">AI is thinking...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Invisible div for auto-scroll target */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Quick prompts */}
              <div className={`px-4 py-3 border-t ${show3DBackground ? "bg-gray-900/50 backdrop-blur-sm border-cyan-500/30" : "bg-gray-50"}`}>
                <p className={`text-xs mb-2 ${show3DBackground ? "text-cyan-400" : "text-gray-600"}`}>Quick actions:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSummary}
                    disabled={isLoading || quizMode}
                    className={show3DBackground ? "bg-gray-800/50 text-white border-cyan-500/50 hover:bg-gray-700/50 hover:text-cyan-100" : ""}
                  >
                    📝 Summary
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleQuiz}
                    disabled={isLoading || quizMode}
                    className={show3DBackground ? "bg-gray-800/50 text-white border-cyan-500/50 hover:bg-gray-700/50 hover:text-cyan-100" : ""}
                  >
                    ✍️ Quiz Me
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExplain}
                    disabled={isLoading || quizMode}
                    className={show3DBackground ? "bg-gray-800/50 text-white border-cyan-500/50 hover:bg-gray-700/50 hover:text-cyan-100" : ""}
                  >
                    💡 Explain
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReadAloud}
                    disabled={!!currentAudio}
                    className={show3DBackground ? "bg-gray-800/50 text-white border-cyan-500/50 hover:bg-gray-700/50 hover:text-cyan-100" : ""}
                  >
                    🔊 Read Aloud
                  </Button>
                </div>
              </div>

              {/* Input area */}
              <div className={`p-4 border-t ${show3DBackground ? "border-cyan-500/30" : ""}`}>
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={quizMode ? "Type or speak your answer..." : "Ask about this file..."}
                    className="resize-none"
                    rows={2}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={toggleVoiceInput}
                      variant={isListening ? "destructive" : "outline"}
                      className="self-end"
                      title="Press Alt to speak"
                      disabled={isLoading}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="self-end"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}