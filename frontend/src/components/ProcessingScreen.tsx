import { Loader2 } from 'lucide-react';
import { Card } from './ui/card';

interface ProcessingScreenProps {
  stage: 'uploading' | 'ocr' | 'synthesis';
}

export function ProcessingScreen({ stage }: ProcessingScreenProps) {
  const messages = {
    uploading: 'Uploading your file...',
    ocr: 'Using Mathpix to recognize your content...',
    synthesis: 'ElevenLabs is bringing it to life through natural speech...'
  };

  const descriptions = {
    uploading: 'Securely storing your document',
    ocr: 'Analyzing equations, formulas, and text',
    synthesis: 'Generating clear, natural-sounding audio'
  };

  return (
    <main className="container mx-auto px-6 lg:px-12 py-12 lg:py-16 max-w-[1200px] min-h-[60vh] flex items-center justify-center" role="main">
      <Card className="bg-white border-[#E2E8F0] shadow-lg p-12 lg:p-16 text-center w-full rounded-lg">
        <div className="flex flex-col items-center gap-8" role="status" aria-live="polite">
          {/* Animated waveform-style loader with smooth transitions */}
          <div className="flex gap-2 lg:gap-3 items-end h-24 lg:h-32" aria-hidden="true">
            <div className="w-3 lg:w-4 bg-[#3B82F6] rounded-full animate-pulse" style={{ height: '40%', animationDelay: '0ms', animationDuration: '800ms' }}></div>
            <div className="w-3 lg:w-4 bg-[#3B82F6] rounded-full animate-pulse" style={{ height: '80%', animationDelay: '100ms', animationDuration: '800ms' }}></div>
            <div className="w-3 lg:w-4 bg-[#2563EB] rounded-full animate-pulse" style={{ height: '60%', animationDelay: '200ms', animationDuration: '800ms' }}></div>
            <div className="w-3 lg:w-4 bg-[#2563EB] rounded-full animate-pulse" style={{ height: '90%', animationDelay: '300ms', animationDuration: '800ms' }}></div>
            <div className="w-3 lg:w-4 bg-[#3B82F6] rounded-full animate-pulse" style={{ height: '70%', animationDelay: '400ms', animationDuration: '800ms' }}></div>
            <div className="w-3 lg:w-4 bg-[#3B82F6] rounded-full animate-pulse" style={{ height: '50%', animationDelay: '500ms', animationDuration: '800ms' }}></div>
          </div>

          <h2 className="text-3xl lg:text-4xl text-[#1D4ED8] px-4">
            {messages[stage]}
          </h2>

          <p className="text-xl lg:text-2xl text-[#64748B] px-4">
            {descriptions[stage]}
          </p>

          <Loader2 className="w-12 h-12 lg:w-16 lg:h-16 animate-spin text-[#3B82F6]" aria-hidden="true" />

          <p className="text-base text-[#64748B] mt-4">
            This may take a few moments. Please wait...
          </p>
        </div>
      </Card>
    </main>
  );
}