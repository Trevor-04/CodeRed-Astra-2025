import { Volume2 } from 'lucide-react';

export function Header() {
  return (
    <header 
      className="bg-[#1D4ED8] overflow-auto py-8 lg:py-12 px-6 lg:px-12 shadow-md sticky top-0 z-50" 
      role="banner"
    >
      <div className="container mx-auto text-center max-w-[1200px]">
        <div className="flex items-center justify-center gap-3 lg:gap-4 mb-3">
          <Volume2 className="w-10 h-10 lg:w-14 lg:h-14 text-white" aria-hidden="true" />
          <h1 className="text-4xl lg:text-5xl text-white">
            STEMVoice
          </h1>
        </div>
        <p className="text-xl lg:text-2xl text-blue-100 px-4">
          See it. Hear it. Learn it — your way.
        </p>
      </div>
    </header>
  );
}