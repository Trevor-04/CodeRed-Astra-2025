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
      className="container mx-auto px-6 lg:px-12 py-6 lg:py-12 max-w-[1200px]"
      role="main"
    >
      {/* Secondary button for back navigation */}

      <h2 className="text-3xl lg:text-4xl mb-8 lg:mb-12 text-center text-[#0F172A]">
        Upload Your STEM Content
      </h2>

      {/* Drop zone with guideline colors: border #3B82F6, hover fill #EFF6FF */}
      <Card
        className={`bg-white border-2 transition-all duration-200 shadow-lg rounded-lg ${
          isDragging
            ? "border-[#3B82F6] bg-[#EFF6FF]"
            : "border-dashed border-[#3B82F6]"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="region"
        aria-label="File upload area"
      >
        <div className="p-12 lg:p-16 text-center">
          <Upload
            className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-8 text-[#3B82F6]"
            aria-hidden="true"
          />

          <p className="text-2xl lg:text-3xl mb-6 px-4 text-[#0F172A]">
            Drag and drop or upload a file
          </p>

          <p className="text-lg lg:text-xl text-[#64748B] mb-12 px-4">
            Upload a photo, PDF, or handwritten equation
          </p>

          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="sr-only"
              id="file-upload"
              aria-label="Choose file from device"
            />
            {/* Primary button - padding 16-24px, radius 8px */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-lg lg:text-xl px-8 py-6 w-full sm:w-auto shadow-md rounded-lg transition-all duration-200 min-h-[48px]"
            >
              <FileText className="w-6 h-6" aria-hidden="true" />
              Choose File
            </Button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="sr-only"
              id="camera-capture"
              aria-label="Take photo with camera"
            />
            {/* Camera icon for mobile as per guidelines */}
            <Button
              onClick={() => cameraInputRef.current?.click()}
              className="gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-lg lg:text-xl px-8 py-6 w-full sm:w-auto shadow-md rounded-lg transition-all duration-200 min-h-[48px]"
            >
              <Camera className="w-6 h-6" aria-hidden="true" />
              Take Photo
            </Button>
          </div>

          <p className="text-base text-[#64748B] mt-8">
            Supported formats: JPG, PNG, PDF
          </p>
        </div>
      </Card>
    </main>
  );
}
