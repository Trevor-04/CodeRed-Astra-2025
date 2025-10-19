import { useState } from "react";
import { Workspace } from "./Workspace";
import { UploadArea } from "./uploadArea";
import { RecordingProcessor } from "./RecordingProcessor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";


interface Upload {
  id: string;
  userId: string;
  type: string;
  filePath: string;
  originalName: string;
  createdAt: string;
}

interface UploadPageProps {
  onBack: () => void;
  onUpload: (file: File) => void;
  mockUploads: Upload[];
  mockExtractedContent: Record<string, string>;
}

export function UploadPage({
  onBack,
  onUpload,
  mockUploads,
  mockExtractedContent,
}: UploadPageProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Upload | null>(
    null
  );

  // Tab state with colors
  const [activeTab, setActiveTab] = useState("notes");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <button
        onClick={onBack}
        className="cursor-pointer mb-6 flex items-center gap-2 text-[#1D4ED8]
         hover:text-[#1E40AF] border-2 border-[#1D4ED8] p-2 rounded-lg min-h-[48px] font-semibold transition-colors"
      >
        ← Back to Dashboard
      </button>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger 
            value="notes" 
            className={`text-lg cursor-pointer ${activeTab === 'notes' ? 'bg-blue-100 text-blue-700' : ''}`}
          >
            📄 Notes
          </TabsTrigger>
          <TabsTrigger 
            value="recordings" 
            className={`text-lg cursor-pointer ${activeTab === 'recordings' ? 'bg-purple-100 text-purple-700' : ''}`}
          >
            🎤 Recordings
          </TabsTrigger>
          <TabsTrigger 
            value="math" 
            className={`text-lg cursor-pointer ${activeTab === 'math' ? 'bg-green-100 text-green-700' : ''}`}
          >
            ∑ Math
          </TabsTrigger>
        </TabsList>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Upload Notes & Documents
              </CardTitle>
              <CardDescription>
                Upload PDFs, slides, or scanned documents. We'll extract text
                and math automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadArea onUpload={onUpload} onBack={onBack} />

              {/* Recent Notes Uploads */}
              {!selectedWorkspace && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Recent Uploads</h3>
                  <div className="space-y-3">
                    {mockUploads
                      .filter((upload) => upload.type === "PDF")
                      .map((upload) => (
                        <div
                          key={upload.id}
                          onClick={() => setSelectedWorkspace(upload)}
                          className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📄</span>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {upload.originalName}
                              </p>
                              <p className="text-sm text-gray-600">
                                Uploaded{" "}
                                {new Date(upload.createdAt).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Processed
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Workspace View */}
              {selectedWorkspace && selectedWorkspace.type === "PDF" && (
                <div className="mt-8">
                  <Workspace
                    upload={selectedWorkspace}
                    extractedContent={
                      mockExtractedContent[selectedWorkspace.id]
                    }
                    onClose={() => setSelectedWorkspace(null)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recordings Tab */}
        <TabsContent value="recordings">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Upload Audio & Video Recordings
              </CardTitle>
              <CardDescription>
                Upload lecture recordings, voice notes, or video files. We'll
                transcribe them automatically using ElevenLabs Speech-to-Text.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecordingProcessor 
                onTranscriptionComplete={(result) => {
                  console.log('Transcription completed:', result);
                  // In a real app, you might save this to the backend or update state
                }}
                onError={(error) => {
                  console.error('Transcription error:', error);
                  // Handle error (show notification, etc.)
                }}
              />

              {/* Recent Recording Uploads */}
              {!selectedWorkspace && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">
                    Recent Recordings
                  </h3>
                  <div className="space-y-3">
                    {mockUploads
                      .filter(
                        (upload) =>
                          upload.type === "video" || upload.type === "audio"
                      )
                      .map((upload) => (
                        <div
                          key={upload.id}
                          onClick={() => setSelectedWorkspace(upload)}
                          className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {upload.type === "video" ? "🎥" : "🔊"}
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {upload.originalName}
                              </p>
                              <p className="text-sm text-gray-600">
                                Uploaded{" "}
                                {new Date(upload.createdAt).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Transcribed
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Workspace View */}
              {selectedWorkspace &&
                (selectedWorkspace.type === "video" ||
                  selectedWorkspace.type === "audio") && (
                  <div className="mt-8">
                    <Workspace
                      upload={selectedWorkspace}
                      extractedContent={
                        mockExtractedContent[selectedWorkspace.id]
                      }
                      onClose={() => setSelectedWorkspace(null)}
                    />
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Math Tab */}
        <TabsContent value="math">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Upload Math & Equations
              </CardTitle>
              <CardDescription>
                Upload images of handwritten or printed equations. We'll convert
                them to LaTeX and make them accessible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">∑</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      Drop math images here
                    </p>
                    <p className="text-gray-600">
                      Supports JPG, PNG, HEIC (handwritten or printed equations)
                    </p>
                  </div>
                  <button className="cursor-pointer px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Browse Images
                  </button>
                </div>
              </div>

              {/* Recent Math Uploads */}
              {!selectedWorkspace && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">
                    Recent Math Uploads
                  </h3>
                  <div className="space-y-3">
                    {mockUploads
                      .filter((upload) => upload.type === "math_image")
                      .map((upload) => (
                        <div
                          key={upload.id}
                          onClick={() => setSelectedWorkspace(upload)}
                          className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📐</span>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {upload.originalName}
                              </p>
                              <p className="text-sm text-gray-600">
                                Uploaded{" "}
                                {new Date(upload.createdAt).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Converted
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Workspace View */}
              {selectedWorkspace && selectedWorkspace.type === "math_image" && (
                <div className="mt-8">
                  <Workspace
                    upload={selectedWorkspace}
                    extractedContent={
                      mockExtractedContent[selectedWorkspace.id]
                    }
                    onClose={() => setSelectedWorkspace(null)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
