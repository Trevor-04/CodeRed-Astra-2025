import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Keyboard, Volume2, Type, Info } from 'lucide-react';

interface SettingsPageProps {
  isDyslexiaFont: boolean;
  highlightAsSpoken: boolean;
  voiceSpeed: number;
  textSpacing: number;
  onToggleDyslexiaFont: () => void;
  onToggleHighlightAsSpoken: () => void;
  onVoiceSpeedChange: (speed: number) => void;
  onTextSpacingChange: (spacing: number) => void;
  onBack: () => void;
}

export function SettingsPage({
  isDyslexiaFont,
  highlightAsSpoken,
  voiceSpeed,
  textSpacing,
  onToggleDyslexiaFont,
  onToggleHighlightAsSpoken,
  onVoiceSpeedChange,
  onTextSpacingChange,
  onBack,
}: SettingsPageProps) {
  return (
    <main className="container mx-auto px-6 lg:px-12 py-6 lg:py-12 max-w-[1200px]" role="main">
      <Button
        onClick={onBack}
        className="cursor-pointer mb-8 min-h-[48px] px-6 bg-white text-[#1D4ED8] border-2 border-[#1D4ED8] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200"
        aria-label="Go back to dashboard"
      >
        ← Back to Dashboard
      </Button>

      <h2 className="text-3xl lg:text-4xl mb-8 lg:mb-12 text-[#0F172A]">Accessibility Settings</h2>

      {/* Visual Settings */}
      <Card className="bg-white border-[#E2E8F0] shadow-md mb-8 rounded-lg">
        <CardHeader className="p-6 lg:p-12">
          <CardTitle className="flex items-center gap-3 text-2xl lg:text-3xl text-[#0F172A]">
            <Type className="w-8 h-8 text-[#3B82F6]" aria-hidden="true" />
            Visual Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-6 lg:p-12 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
            <div className="flex-1">
              <Label htmlFor="dyslexia-font" className="text-xl text-[#0F172A]">OpenDyslexic Font</Label>
              <p className="text-base text-[#64748B] mt-2">
                Use OpenDyslexic font with increased letter spacing for easier reading
              </p>
            </div>
            <Switch
              id="dyslexia-font"
              checked={isDyslexiaFont}
              onCheckedChange={onToggleDyslexiaFont}
              aria-label="Toggle dyslexia-friendly font"
              className="flex-shrink-0"
            />
          </div>

          {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
            <div className="flex-1">
              <Label htmlFor="contrast-mode" className="text-xl text-[#0F172A]">High Contrast Mode</Label>
              <p className="text-base text-[#64748B] mt-2">
                Deep blue background with white text for better visibility (WCAG AA compliant)
              </p>
            </div>
            <Switch
              id="contrast-mode"
              checked={isContrastMode}
              onCheckedChange={onToggleContrastMode}
              aria-label="Toggle high contrast mode"
              className="flex-shrink-0"
            />
          </div> */}

          <div>
            <Label htmlFor="text-spacing" className="text-xl text-[#0F172A]">Text Spacing</Label>
            <p className="text-base text-[#64748B] mb-4">
              Adjust spacing between letters and words
            </p>
            <input
              id="text-spacing"
              type="range"
              min="1"
              max="3"
              step="0.5"
              value={textSpacing}
              onChange={(e) => onTextSpacingChange(Number(e.target.value))}
              className="w-full h-3 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
              aria-label="Text spacing slider"
              aria-valuemin={1}
              aria-valuemax={3}
              aria-valuenow={textSpacing}
            />
            <div className="flex justify-between text-base text-[#64748B] mt-2">
              <span>Normal</span>
              <span>Wide</span>
              <span>Extra Wide</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Settings */}
      <Card className="bg-white border-[#E2E8F0] shadow-md mb-8 rounded-lg">
        <CardHeader className="p-6 lg:p-12">
          <CardTitle className="flex items-center gap-3 text-2xl lg:text-3xl text-[#0F172A]">
            <Volume2 className="w-8 h-8 text-[#2563EB]" aria-hidden="true" />
            Audio Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-6 lg:p-12 pt-0">
          <div>
            <Label htmlFor="voice-speed-settings" className="text-xl text-[#0F172A]">Voice Speed</Label>
            <p className="text-base text-[#64748B] mb-4">
              Control how fast the narration plays
            </p>
            <select
              id="voice-speed-settings"
              value={voiceSpeed}
              onChange={(e) => onVoiceSpeedChange(Number(e.target.value))}
              className="cursor-pointer w-full bg-white border-2 border-[#E2E8F0] rounded-lg px-4 py-4 text-lg text-[#0F172A] min-h-[48px]"
              aria-label="Voice speed control"
            >
              <option value={0.5}>0.5x - Very Slow</option>
              <option value={0.75}>0.75x - Slow</option>
              <option value={1}>1.0x - Normal</option>
              <option value={1.25}>1.25x - Fast</option>
              <option value={1.5}>1.5x - Very Fast</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="highlight-spoken" className="text-xl text-[#0F172A]">Highlight as Spoken</Label>
              <p className="text-base text-[#64748B] mt-2">
                Highlight each word as it's being read aloud
              </p>
            </div>
            <Switch
              id="highlight-spoken"
              checked={highlightAsSpoken}
              onCheckedChange={onToggleHighlightAsSpoken}
              aria-label="Toggle word highlighting during audio playback"
              className="flex-shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Navigation */}
      <Card className="bg-[#F8FAFC] border-[#E2E8F0] shadow-md mb-8 rounded-lg">
        <CardHeader className="p-6 lg:p-12">
          <CardTitle className="flex items-center gap-3 text-2xl lg:text-3xl text-[#0F172A]">
            <Keyboard className="w-8 h-8 text-[#3B82F6]" aria-hidden="true" />
            Keyboard Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 lg:p-12 pt-0">
          <div className="space-y-5 text-lg text-[#0F172A]">
            <div className="flex justify-between items-center gap-4">
              <span className="flex-1">Navigate between elements</span>
              <kbd className="px-4 py-2 bg-white rounded-lg border-2 border-[#E2E8F0] text-base text-[#0F172A] min-w-[64px] text-center">Tab</kbd>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="flex-1">Activate buttons and links</span>
              <kbd className="px-4 py-2 bg-white rounded-lg border-2 border-[#E2E8F0] text-base text-[#0F172A] min-w-[64px] text-center">Enter</kbd>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="flex-1">Toggle switches</span>
              <kbd className="px-4 py-2 bg-white rounded-lg border-2 border-[#E2E8F0] text-base text-[#0F172A] min-w-[64px] text-center">Space</kbd>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="flex-1">Play/Pause audio</span>
              <kbd className="px-4 py-2 bg-white rounded-lg border-2 border-[#E2E8F0] text-base text-[#0F172A] min-w-[64px] text-center">Space</kbd>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screen Reader Info */}
      <Card className="bg-white border-[#E2E8F0] shadow-md rounded-lg">
        <CardHeader className="p-6 lg:p-12">
          <CardTitle className="flex items-center gap-3 text-2xl lg:text-3xl text-[#0F172A]">
            <Info className="w-8 h-8 text-[#2563EB]" aria-hidden="true" />
            Screen Reader Support
          </CardTitle>
        </CardHeader>
        <CardContent className="text-lg p-6 lg:p-12 pt-0 space-y-4 text-[#0F172A]">
          <p>
            STEMVoice is fully compatible with screen readers including NVDA, JAWS, and VoiceOver.
          </p>
          <p>
            All interactive elements have descriptive labels, and important updates are announced automatically. 
            The app follows WCAG 2.1 AA guidelines with minimum 4.5:1 contrast ratios.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}