import { useState } from "react";
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
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setChatMessages([...chatMessages, userMessage]);
    setInputMessage("");

    // Simulate AI response (replace with actual AI call later)
    setTimeout(() => {
      let aiResponse = "";

      if (inputMessage.toLowerCase().includes("summary")) {
        aiResponse =
          "Here's a summary: " + extractedContent.substring(0, 200) + "...";
      } else if (inputMessage.toLowerCase().includes("quiz")) {
        aiResponse =
          "Here are 3 quiz questions based on the content:\n\n1. What is the main topic discussed?\n2. Can you explain the key concept?\n3. How would you apply this in practice?";
      } else if (inputMessage.toLowerCase().includes("explain")) {
        aiResponse =
          "Let me break that down for you. Based on your notes, the key concepts include...";
      } else {
        aiResponse = `Great question! Based on the content in "${upload.originalName}", I can help you with that. The material covers several important points...`;
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
    }, 1000);
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
                {extractedContent.split("\n\n").map((paragraph, index) => (
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
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about this file..."
                  className="resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
