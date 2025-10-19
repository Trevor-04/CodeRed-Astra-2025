import { Settings, Volume2, Type } from 'lucide-react';
import { Button } from './ui/button';

interface AccessibilityBarProps {
  isDyslexiaFont: boolean;
  isContrastMode: boolean;
  voiceSpeed: number;
  onToggleDyslexiaFont: () => void;
  onToggleContrastMode: () => void;
  onVoiceSpeedChange: (speed: number) => void;
  onOpenSettings: () => void;
}

export function AccessibilityBar({
  isDyslexiaFont,
  // isContrastMode,
  voiceSpeed,
  onToggleDyslexiaFont,
  // onToggleContrastMode,
  onVoiceSpeedChange,
  onOpenSettings,
}: AccessibilityBarProps) {
  return (
    <div 
      className="bg-white border-b border-[#E2E8F0] py-4 px-6 lg:px-12 shadow-sm"
      role="toolbar"
      aria-label="Accessibility controls"
    >
      <div className="container mx-auto flex flex-wrap gap-4 items-center justify-between max-w-[1200px]">
        <div className="flex flex-wrap gap-3">
          {/* Primary buttons with guideline styling */}
          <Button
            onClick={onToggleDyslexiaFont}
            className={`cursor-pointer gap-2 min-h-[48px] min-w-[48px] px-4 lg:px-6 rounded-lg text-base transition-all duration-200 ${
              isDyslexiaFont 
                ? 'bg-[#10B981] text-white hover:bg-[#059669] shadow-lg border-2 border-[#10B981]' 
                : 'bg-white text-[#1D4ED8] border-2 border-[#1D4ED8] hover:bg-[#F8FAFC]'
            }`}
            aria-pressed={isDyslexiaFont}
            aria-label="Toggle dyslexia-friendly font"
          >
            <Type className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline">{isDyslexiaFont ? '✓ Dyslexia Font' : 'Dyslexia Font'}</span>
            <span className="sm:hidden">{isDyslexiaFont ? '✓ Font' : 'Font'}</span>
          </Button>

          {/* <Button
            onClick={onToggleContrastMode}
            className={`cursor-pointer gap-2 min-h-[48px] min-w-[48px] px-4 lg:px-6 rounded-lg text-base transition-all duration-200 ${
              isContrastMode 
                ? 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF]' 
                : 'bg-white text-[#1D4ED8] border-2 border-[#1D4ED8] hover:bg-[#F8FAFC]'
            }`}
            aria-pressed={isContrastMode}
            aria-label="Toggle high contrast mode"
          >
            {isContrastMode ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
            <span className="hidden sm:inline">High Contrast</span>
            <span className="sm:hidden">Contrast</span>
          </Button> */}

          <div className="flex items-center gap-2 px-4 py-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] min-h-[48px]">
            <Volume2 className="w-5 h-5 text-[#3B82F6]" aria-hidden="true" />
            <label htmlFor="voice-speed" className="text-base hidden sm:inline text-[#0F172A]">Speed:</label>
            <select
              id="voice-speed"
              value={voiceSpeed}
              onChange={(e) => onVoiceSpeedChange(Number(e.target.value))}
              className="bg-white border cursor-pointer border-[#E2E8F0] rounded-lg px-3 py-2 text-base min-w-[80px] text-[#0F172A]"
              aria-label="Voice speed control"
            >
              <option value={0.75}>0.75x</option>
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
            </select>
          </div>
        </div>

        <Button
          onClick={onOpenSettings}
          className="cursor-pointer gap-2 min-h-[48px] min-w-[48px] px-4 lg:px-6 bg-white text-[#1D4ED8] border-2 border-[#1D4ED8] hover:bg-[#F8FAFC] rounded-lg text-base transition-all duration-200"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </div>
    </div>
  );
}