import { Upload, Headphones, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface DashboardProps {
  onNavigate: (screen: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <main className="container mx-auto px-6 lg:px-12 py-6 lg:py-12 max-w-[1200px]" role="main">
      {/* Section padding: 24px mobile, 48px desktop */}
      <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2 mb-8 lg:mb-12">
        {/* Primary Button styling from guidelines */}
        <Button
          onClick={() => onNavigate('upload')}
          className="cursor-pointer h-auto py-12 lg:py-16 flex flex-col items-center gap-4 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xl rounded-lg shadow-lg transition-all duration-200 hover:scale-105 px-6"
          aria-label="Upload notes or equations to convert to audio"
        >
          <Upload className="w-16 h-16 lg:w-20 lg:h-20" aria-hidden="true" />
          <span className="text-2xl lg:text-3xl text-center">🎓 Upload Notes or Equations</span>
        </Button>

        <Button
          onClick={() => onNavigate('lessons')}
          className="cursor-pointer h-auto py-12 lg:py-16 flex flex-col items-center gap-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xl rounded-lg shadow-lg transition-all duration-200 hover:scale-105 px-6"
          aria-label="Listen to past lessons"
        >
          <Headphones className="w-16 h-16 lg:w-20 lg:h-20" aria-hidden="true" />
          <span className="text-2xl lg:text-3xl text-center">🎧 Listen to Past Lessons</span>
        </Button>
      </div>

      {/* Surface Alt color for card */}
      <Card className="bg-[#F8FAFC] border-[#E2E8F0] shadow-md rounded-lg">
        <CardHeader className="p-6 lg:p-12">
          <CardTitle className="flex items-center gap-3 text-2xl lg:text-3xl text-[#0F172A]">
            <Info className="w-8 h-8 text-[#3B82F6] flex-shrink-0" aria-hidden="true" />
            About STEMVoice
          </CardTitle>
        </CardHeader>
        <CardContent className="text-lg lg:text-xl leading-relaxed p-6 lg:p-12 pt-0 space-y-6 text-[#0F172A]">
          <p>
            Empowering students with blindness, low vision, or dyslexia through math and science audio learning.
          </p>
          <p>
            Upload handwritten or printed STEM materials, and we'll convert them into clear, spoken audio and readable, 
            dyslexia-friendly text for inclusive learning.
          </p>
        </CardContent>
      </Card>
      
    </main>
  );
}