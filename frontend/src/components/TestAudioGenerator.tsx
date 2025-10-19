import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Mic, Download } from 'lucide-react';

export function TestAudioGenerator() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const downloadTestAudio = () => {
    if (!audioBlob) return;
    
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-recording.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };



  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Test Audio Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Stop Recording
            </Button>
          )}
          
          {audioBlob && (
            <Button
              onClick={downloadTestAudio}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Test Audio
            </Button>
          )}
        </div>

        {isRecording && (
          <div className="text-sm text-red-600">
            🔴 Recording... Say something like "Hello, this is a test recording for speech-to-text transcription."
          </div>
        )}

        {audioBlob && (
          <div className="space-y-2">
            <p className="text-sm text-green-600">
              ✅ Test recording ready! You can now use this file to test transcription.
            </p>
            <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
          </div>
        )}

        <div className="text-xs text-gray-500">
          <strong>Suggested test phrases:</strong>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>"The quick brown fox jumps over the lazy dog."</li>
            <li>"To be or not to be, that is the question."</li>
            <li>"This is a test of the ElevenLabs speech-to-text transcription service."</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}