import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Key, CheckCircle, AlertCircle } from 'lucide-react';
import { SpeechToTextService } from '../services/speechToTextService';

interface ApiKeyConfigProps {
  onConfigured: () => void;
}

export function ApiKeyConfig({ onConfigured }: ApiKeyConfigProps) {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const speechToTextService = SpeechToTextService.getInstance();

  useEffect(() => {
    // Check if API key is already configured
    setIsConfigured(speechToTextService.isConfigured());
  }, [speechToTextService]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your ElevenLabs API key');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Set the API key
      speechToTextService.setApiKey(apiKey.trim());
      
      // Test the API key
      const testResult = await speechToTextService.testApiKey();
      
      if (!testResult.valid) {
        throw new Error(testResult.error || 'API key validation failed');
      }

      setIsConfigured(true);
      onConfigured();
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to configure API key');
      speechToTextService.setApiKey(''); // Clear invalid key
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseMockMode = () => {
    speechToTextService.setApiKey(''); // Clear any existing key to use mock mode
    setIsConfigured(false);
    onConfigured();
  };

  if (isConfigured) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ✅ ElevenLabs API key configured! Ready to transcribe with real API.
          <Button
            onClick={() => {
              speechToTextService.setApiKey('');
              setIsConfigured(false);
              setApiKey('');
            }}
            variant="outline"
            size="sm"
            className="ml-3"
          >
            Change Key
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Configure ElevenLabs API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="api-key" className="text-sm font-medium">
            ElevenLabs API Key
          </label>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your ElevenLabs API key..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-gray-600">
            Get your API key from{' '}
            <a
              href="https://elevenlabs.io/app/speech-synthesis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              ElevenLabs Dashboard
            </a>
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleSaveApiKey}
            disabled={isLoading || !apiKey.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? 'Configuring...' : 'Use Real API'}
          </Button>
          <Button
            onClick={handleUseMockMode}
            variant="outline"
          >
            Continue with Mock Mode
          </Button>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Real API:</strong> Uses your ElevenLabs credits to transcribe actual audio content.
            <br />
            <strong>Mock Mode:</strong> Shows demo transcription without using API credits.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}