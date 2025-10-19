import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import {
  Send,
  FileText,
  Image as ImageIcon,
  Video,
  Sparkles,
  Volume2,
  Mic,
  MicOff,
} from "lucide-react";

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt key - Start voice input
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        toggleVoiceInput();
      }
      // Ctrl key - Focus on text input
      else if (e.ctrlKey && !e.altKey && !e.shiftKey && e.key === 'Control') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening]);

  // Auto-speak new assistant messages
  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.shouldSpeak && !currentAudio) {
      speakText(lastMessage.content);
    }
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

  // Call backend AI endpoints
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

  // Text-to-Speech function
  const speakText = async (text: string) => {
    try {
      // Stop current audio if playing
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
        throw new Error('TTS failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      audio.play();

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
        
        // If in quiz mode, move to next question
        if (quizMode && currentQuestionIndex < currentQuizQuestions.length - 1) {
          setTimeout(() => {
            askNextQuestion();
          }, 1000);
        }
      };
    } catch (error) {
      console.error('TTS Error:', error);
    }
  };

  // Convert LaTeX to readable text
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

    // If in quiz mode, treat as answer
    if (quizMode) {
      handleQuizAnswer(inputMessage);
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setChatMessages([...chatMessages, userMessage]);
    const currentInput = inputMessage;
    setInputMessage("");

    // Determine which AI endpoint to call
    let endpoint = "explain";
    if (currentInput.toLowerCase().includes("summary") || currentInput.toLowerCase().includes("summarize")) {
      endpoint = "summary";
    } else if (currentInput.toLowerCase().includes("quiz")) {
      endpoint = "quiz";
    }

    // Call backend
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

  // Quiz handling - parse and ask one at a time
  const handleQuiz = async () => {
    setIsLoading(true);
    const data = await callAIBackend('quiz');
    
    if (data.quiz) {
      // Parse questions from response
      const questions = data.quiz.split(/Question \d+:/g).filter((q: string) => q.trim());
      
      if (questions.length > 0) {
        setQuizMode(true);
        setCurrentQuizQuestions(questions);
        setCurrentQuestionIndex(0);
        
        // Ask first question
        const firstQuestion = `Question 1: ${questions[0].trim()}`;
        const message: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: firstQuestion,
          timestamp: new Date().toISOString(),
          shouldSpeak: true,
        };
        
        setChatMessages((prev) => [...prev, message]);
      }
    }
  };

  const askNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < currentQuizQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      
      const nextQuestion = `Question ${nextIndex + 1}: ${currentQuizQuestions[nextIndex].trim()}`;
      const message: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: nextQuestion,
        timestamp: new Date().toISOString(),
        shouldSpeak: true,
      };
      
      setChatMessages((prev) => [...prev, message]);
    } else {
      // Quiz finished
      setQuizMode(false);
      const finishMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Great job completing the quiz! Would you like me to explain any of the concepts further?",
        timestamp: new Date().toISOString(),
        shouldSpeak: true,
      };
      setChatMessages((prev) => [...prev, finishMessage]);
    }
  };

  const handleQuizAnswer = async (answer: string) => {
    // Add user's answer
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: answer,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    // Simple feedback
    const feedback: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Got it! Let me move to the next question.",
      timestamp: new Date().toISOString(),
      shouldSpeak: true,
    };
    setChatMessages((prev) => [...prev, feedback]);
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
    <div className="space-y-4">
      {/* Back Button */}
      <Button variant="outline" onClick={onClose} className="gap-2">
        ← Back to Uploads
      </Button>

      {/* Keyboard Shortcuts Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <strong>Keyboard Shortcuts:</strong> Press <kbd className="px-2 py-1 bg-white border rounded">Alt</kbd> to speak your answer, 
        or <kbd className="px-2 py-1 bg-white border rounded">Ctrl</kbd> to type
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - File Content */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
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
            <ScrollArea className="h-[500px] p-6">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Extracted Content
                </h3>
                {extractedContent.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-700 leading-relaxed">
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
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right side - AI Chat */}
        <Card className="flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Assistant
              {quizMode && <span className="text-sm font-normal text-purple-600">(Quiz Mode)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-[500px]">
            {/* Chat messages */}
            <ScrollArea className="flex-1 p-4">
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
                          ? "bg-indigo-600 text-white"
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
                              ? "text-indigo-200"
                              : "text-gray-500"
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                        {message.role === "assistant" && (
                          <button
                            onClick={() => speakText(message.content)}
                            className="ml-2 text-xs flex items-center gap-1 hover:underline"
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
                    <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                      <p className="text-sm">AI is thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick prompts */}
            <div className="px-4 py-3 border-t bg-gray-50">
              <p className="text-xs text-gray-600 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSummary}
                  disabled={isLoading || quizMode}
                >
                  📝 Summary
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuiz}
                  disabled={isLoading || quizMode}
                >
                  ✍️ Quiz (One at a Time)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExplain}
                  disabled={isLoading || quizMode}
                >
                  💡 Explain
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReadAloud}
                  disabled={!!currentAudio}
                >
                  🔊 Read Aloud
                </Button>
              </div>
            </div>

            {/* Input area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={quizMode ? "Your answer..." : "Ask about this file..."}
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
  );
}