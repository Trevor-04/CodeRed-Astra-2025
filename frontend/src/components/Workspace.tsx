import { useRef as useDomRef } from "react";
// Helper to upload file to backend and get public URL
async function uploadFileToSupabaseBucket(file: File, userId: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  const response = await fetch('http://localhost:3000/api/upload-to-bucket', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload file');
  const { publicURL } = await response.json();
  return publicURL;
}
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

import {
  Send,
  FileText,
  Image as ImageIcon,
  Video,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Upload {
  id: string;
  userId: string;
  type: string;
  filePath: string;
  originalName: string;
  createdAt: string;
  parsedText?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface WorkspaceProps {
  upload: Upload;
  extractedContent?: string; // Keep for backwards compatibility
  onClose?: () => void;
}

export function Workspace({
  upload,
  extractedContent,
  onClose,
}: WorkspaceProps) {
  // Use parsedText from upload if available, otherwise fall back to extractedContent prop
  const content = upload.parsedText || extractedContent || "No content available";

  // Log workspace data when opened
  useEffect(() => {
    console.log("\n🔍 WORKSPACE OPENED:");
    console.log("Upload Details:", {
      id: upload.id,
      name: upload.originalName,
      type: upload.type,
      filePath: upload.filePath,
      createdAt: upload.createdAt,
    });
    console.log("Content Source:", upload.parsedText ? "upload.parsedText" : extractedContent ? "extractedContent prop" : "none");
    console.log("Content Length:", content.length, "characters");
    console.log("Content Preview (first 200 chars):", content.substring(0, 200));
    console.log("Full Content:", content);
  }, [upload, extractedContent, content]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hi! I've analyzed "${upload.originalName}". I can help you understand the content, create summaries, generate quizzes, or answer any questions you have!`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive (disabled)
  // useEffect(() => {
  //   chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [chatMessages]);

  // Cleanup event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isStreaming) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage("");
    setIsStreaming(true);

    // Create placeholder AI message
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, aiMessage]);

    // Build the query with context
    const queryParams = new URLSearchParams({
      message: currentInput,
      context: content,
    });

    // Connect to SSE stream
    const eventSource = new EventSource(
      `http://localhost:8000/stream?${queryParams}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const char = event.data;
      // Append each character to the AI message
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: msg.content + char }
            : msg
        )
      );
    };

    eventSource.onerror = () => {
      console.log("SSE connection closed");
      eventSource.close();
      setIsStreaming(false);
      
      // Only show error message if no content was received (actual error)
      setChatMessages((prev) => {
        const currentMsg = prev.find(msg => msg.id === aiMessageId);
        if (currentMsg && currentMsg.content === "") {
          // No content received = real error
          toast.error("Failed to connect to AI service. Is the backend running?");
          return prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  content:
                    "Sorry, I encountered an error. Please make sure the AI service is running on http://localhost:8000",
                }
              : msg
          );
        }
        // Content was received = normal stream end, don't show error
        return prev;
      });
    };

    // Close stream after a reasonable timeout or when done
    setTimeout(() => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
        setIsStreaming(false);
      }
    }, 30000); // 30 second timeout
  };

  const getFileIcon = () => {
    if (upload.type.includes("math") || upload.type.includes("image"))
      return <ImageIcon className="w-5 h-5" />;
    if (upload.type.includes("video") || upload.type.includes("audio"))
      return <Video className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };
  

  // For PDF upload UI
  const [pdfUrl, setPdfUrl] = useState<string | null>(upload.filePath && upload.type.toLowerCase().includes("pdf") ? upload.filePath : null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useDomRef<HTMLInputElement>(null);

  // State for toggling file preview
  const [showPreview, setShowPreview] = useState(true);

  // Handler for PDF file upload
  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Use upload.userId if available, else fallback
      const userId = upload.userId || "demo-user";
      const url = await uploadFileToSupabaseBucket(file, userId);
      setPdfUrl(url);
      toast.success("PDF uploaded and available!");
    } catch {
      toast.error("Failed to upload PDF");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button variant="outline" onClick={onClose} className="cursor-pointer gap-2">
       ← Back to Uploads
      </Button>

      <div className="flex flex-col gap-6">
        {/* File Content on top */}
        {/* File Content Button and Preview */}
        <button
          className="w-full text-left focus:outline-none"
          style={{ background: 'none', border: 'none', padding: 0 }}
          onClick={() => setShowPreview((prev) => !prev)}
          disabled={upload.type.toLowerCase().includes("pdf") && !pdfUrl}
        >
          <Card className="hover:bg-gray-100 transition-colors cursor-pointer">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                {getFileIcon()}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {upload.originalName}
                  </div>
                  <div className="text-sm text-gray-500 font-normal">
                    {upload.type} • Uploaded {new Date(upload.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        </button>
        {/* Only show preview if toggled on and file is available */}
        {showPreview && upload.type.toLowerCase().includes("pdf") && pdfUrl && (
          <iframe
            src={pdfUrl}
            title="PDF Preview"
            width="100%"
            height="500px"
            style={{ border: "none" }}
          />
        )}
        {/* If not PDF, show extracted content in preview */}
        {showPreview && !upload.type.toLowerCase().includes("pdf") && (
          <div className="prose prose-sm max-w-none w-full mt-4">
            {content.split("\n\n").map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}
        {/* Upload PDF UI if no PDF is present */}
        {upload.type.toLowerCase().includes("pdf") && !pdfUrl && (
          <div className="w-full flex flex-col items-center mt-4">
            <p className="mb-2 text-gray-700">No PDF file found. Upload a PDF to view it:</p>
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handlePdfFileChange}
              disabled={uploading}
              className="mb-2"
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload PDF"}
            </Button>
          </div>
        )}

        {/* AI Chat below */}
        <Card className="flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col min-h-0 p-0">
            {/* Chat messages - fixed height, scrollable */}
            <div className="flex-1 min-h-0">
              <div
                className="h-[400px] overflow-y-auto px-4 py-4 bg-gradient-to-b from-gray-50 to-white border border-gray-200 rounded-lg shadow-inner space-y-6"
                style={{ scrollbarGutter: 'stable' }}
              >
                {chatMessages.map((message, idx) => (
                  <div
                    key={message.id}
                    className={`flex w-full ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } animate-fade-in`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-5 py-3 shadow transition-all border ${
                        message.role === "user"
                          ? "bg-indigo-600 text-white ml-10 border-indigo-200"
                          : "bg-white text-gray-900 mr-10 border-gray-200"
                      }`}
                      style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                    >
                      <div className="text-base leading-relaxed">
                        {message.role === "assistant" && message.content !== "" ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          message.content
                        )}
                        {message.role === "assistant" && message.content === "" && (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Thinking...
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-xs mt-2 text-right opacity-70 ${
                          message.role === "user"
                            ? "text-indigo-100"
                            : "text-gray-400"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Quick prompts */}
            <div className="px-4 py-3 border-t bg-gray-50">
              <p className="text-xs text-gray-600 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setInputMessage("Give me a summary of this content")
                  }
                >
                  📝 Summary
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("Create a quiz from this")}
                >
                  ✍️ Quiz
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("Explain the key concepts")}
                >
                  💡 Explain
                </Button>
              </div>
            </div>

            {/* Input area */}
            <div className="p-4 border-t">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about this file..."
                  className="resize-none w-full max-h-32 overflow-y-auto"
                  rows={2}
                  disabled={isStreaming}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isStreaming}
                  className="self-end"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
