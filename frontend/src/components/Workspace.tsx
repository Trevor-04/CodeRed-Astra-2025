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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  return (
    <div className="space-y-4">-
      {/* Back Button */}
      <Button variant="outline" onClick={onClose} className="cursor-pointer gap-2">
       ← Back to Uploads
      </Button>

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
                {content.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
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
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[500px] flex flex-col min-h-0 p-0">
            {/* Chat messages */}
            <ScrollArea className="flex-1 h-full p-4 overflow-y-auto">
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
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                        {message.role === "assistant" && message.content === "" && (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Thinking...
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          message.role === "user"
                            ? "text-indigo-200"
                            : "text-gray-500"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

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
