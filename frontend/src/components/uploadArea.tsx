import { Upload, Camera, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useState, useRef } from "react";

interface UploadAreaProps {
  onUpload: (file: File) => void;
  onBack: () => void;
}

export function UploadArea({ onUpload, onBack }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <main
      className="container mx-auto px-4 py-8 max-w-6xl"
      role="main"
    >

      {/* Drop zone with guideline colors: border #3B82F6, hover fill #EFF6FF */}
     <Card
  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
    isDragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300"
  }`}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
>
  <div className="flex flex-col items-center gap-4">
    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
      <Upload className="w-8 h-8 text-indigo-600" />
    </div>

    <div>
      <p className="text-lg font-semibold text-gray-900 mb-1">
        Drag & drop files here
      </p>
      <p className="text-gray-600">Supports PDFs and images</p>
    </div>

    <input
      ref={fileInputRef}
      type="file"
      accept="image/*,.pdf"
      onChange={handleFileSelect}
      className="hidden"
    />

    <button
      onClick={() => fileInputRef.current?.click()}
      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
    >
      Browse Files
    </button>
  </div>
</Card>

    </main>
  );
}
