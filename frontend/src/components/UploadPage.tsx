import { useState } from "react";
import { Workspace } from "./Workspace";
import { UploadArea } from "./uploadArea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleMathUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      const newUpload: Upload = {
        id: data.id,
        userId: 'current-user',
        type: 'math_image',
        filePath: data.filename,
        originalName: data.filename,
        createdAt: data.timestamp,
      };

      mockExtractedContent[data.id] = data.extractedContent;
      mockUploads.unshift(newUpload);

      setUploadSuccess(true);
      setTimeout(() => {
        setSelectedWorkspace(newUpload);
        setUploadSuccess(false);
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        Back to Dashboard
      </button>

      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="notes" className="text-lg">
            📄 Notes
          </TabsTrigger>
          <TabsTrigger value="recordings" className="text-lg">
            🎤 Recordings
          </TabsTrigger>
          <TabsTrigger value="math" className="text-lg">
            ∑ Math
          </TabsTrigger>
        </TabsList>

        {/* Notes Tab - UNCHANGED */}
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

        {/* Recordings Tab - UNCHANGED */}
        <TabsContent value="recordings">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Upload Audio & Video Recordings
              </CardTitle>
              <CardDescription>
                Upload lecture recordings, voice notes, or video files. We'll
                transcribe them automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🎤</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      Drop audio/video files here
                    </p>
                    <p className="text-gray-600">
                      Supports MP3, WAV, MP4, MOV (max 100MB)
                    </p>
                  </div>
                  <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Browse Files
                  </button>
                </div>
              </div>

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

        {/* ========================================= */}
        {/* Math Tab - POLISHED VERSION */}
        {/* ========================================= */}
        <TabsContent value="math">
          <Card className="shadow-lg border-2">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-2xl flex items-center gap-2">
                <span className="text-3xl">∑</span>
                Upload Math & Equations
              </CardTitle>
              <CardDescription className="text-base">
                Upload images of handwritten or printed equations. We'll convert
                them to LaTeX and make them accessible with AI assistance.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Upload Area */}
              <div 
                className={`relative border-3 rounded-xl p-12 text-center transition-all duration-300 ${
                  isUploading 
                    ? 'border-blue-500 bg-blue-50 border-solid' 
                    : uploadSuccess
                      ? 'border-green-500 bg-green-50 border-solid'
                      : 'border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50/30 cursor-pointer'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files[0] && !isUploading) {
                    handleMathUpload(e.dataTransfer.files[0]);
                  }
                }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isUploading 
                      ? 'bg-blue-100 animate-pulse' 
                      : uploadSuccess
                        ? 'bg-green-100'
                        : 'bg-gradient-to-br from-green-100 to-emerald-100'
                  }`}>
                    {isUploading ? (
                      <Loader2 className="text-4xl text-blue-600 animate-spin" size={40} />
                    ) : uploadSuccess ? (
                      <CheckCircle className="text-4xl text-green-600" size={40} />
                    ) : (
                      <span className="text-4xl">∑</span>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xl font-bold text-gray-900 mb-2">
                      {isUploading 
                        ? 'Processing your math equation...' 
                        : uploadSuccess
                          ? 'Successfully uploaded!'
                          : 'Drop math images here'}
                    </p>
                    <p className="text-gray-600 text-base">
                      {isUploading 
                        ? 'Extracting equations with AI...' 
                        : 'Supports JPG, PNG, HEIC (handwritten or printed equations)'}
                    </p>
                  </div>
                  
                  {!isUploading && !uploadSuccess && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="math-file-input"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleMathUpload(e.target.files[0]);
                          }
                        }}
                      />
                      
                      <button 
                        onClick={() => document.getElementById('math-file-input')?.click()}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                      >
                        <Upload className="inline mr-2" size={20} />
                        Browse Images
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 animate-in slide-in-from-top">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-red-900">Upload Failed</p>
                    <p className="text-red-700 text-sm">{uploadError}</p>
                  </div>
                </div>
              )}

              {/* Recent Math Uploads */}
              {!selectedWorkspace && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">📐</span>
                    Recent Math Uploads
                  </h3>
                  
                  {mockUploads.filter((upload) => upload.type === "math_image").length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                      <p className="text-gray-500 text-lg">No uploads yet. Upload your first equation above!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mockUploads
                        .filter((upload) => upload.type === "math_image")
                        .map((upload) => (
                          <div
                            key={upload.id}
                            onClick={() => setSelectedWorkspace(upload)}
                            className="group p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:border-green-400 hover:shadow-lg cursor-pointer transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <span className="text-2xl">📐</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                                  {upload.originalName}
                                </p>
                                <p className="text-sm text-gray-600">
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
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold shadow-sm">
                                ✓ Ready
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
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