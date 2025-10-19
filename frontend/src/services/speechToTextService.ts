/**
 * ElevenLabs Speech-to-Text Service
 * Handles transcription using ElevenLabs API with progress tracking and error handling
 */

export interface TranscriptionProgress {
  stage: 'uploading' | 'processing' | 'transcribing' | 'complete';
  progress: number;
  message: string;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  confidence: number;
  duration: number;
  language: string;
  timestamp: string;
  chunks?: TranscriptionChunk[];
}

export interface TranscriptionChunk {
  text: string;
  timestamp: [number, number]; // [start, end] in seconds
  confidence: number;
}

export interface TranscriptionOptions {
  language?: string;
  model?: string;
  optimizeForAccuracy?: boolean;
}

export class SpeechToTextService {
  private static instance: SpeechToTextService;
  private apiKey: string | null = null;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  static getInstance(): SpeechToTextService {
    if (!SpeechToTextService.instance) {
      SpeechToTextService.instance = new SpeechToTextService();
    }
    return SpeechToTextService.instance;
  }

  constructor() {
    // Set your API key directly here for development
    // Replace 'your-api-key-here' with your actual ElevenLabs API key
    this.apiKey = 'sk_b344e54a4f4061cd5085d33079089c7d44a9757a88712da7'; // <-- PUT YOUR ACTUAL API KEY HERE
  }

  /**
   * Set the ElevenLabs API key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Test the API key by making a simple request
   */
  async testApiKey(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey) {
      return { valid: false, error: 'No API key provided' };
    }

    try {
      // Test with a minimal request to check if API key is valid
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (response.ok) {
        return { valid: true };
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else {
        return { valid: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'your-api-key-here';
  }

  /**
   * Transcribe audio using ElevenLabs Speech-to-Text API
   */
  async transcribeAudio(
    audioBlob: Blob,
    options: TranscriptionOptions = {},
    onProgress: (progress: TranscriptionProgress) => void
  ): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured. Please set your API key first.');
    }

    try {
      onProgress({
        stage: 'uploading',
        progress: 10,
        message: 'Preparing audio for transcription...'
      });

      // Convert audio to supported format if needed
      const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      
      // Create form data for ElevenLabs API
      const formData = new FormData();
      formData.append('file', audioFile);
      
      // Add model parameter (ElevenLabs requires this)
      formData.append('model_id', 'scribe_v1');
      
      // Optional: optimize for accuracy
      if (options.optimizeForAccuracy) {
        formData.append('optimize_streaming_latency', '0');
      }

      onProgress({
        stage: 'uploading',
        progress: 30,
        message: 'Uploading audio to ElevenLabs...'
      });

      // Make API request to ElevenLabs Speech-to-Text
      const response = await fetch(`${this.baseUrl}/speech-to-text`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorData: any = {};
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        console.error('ElevenLabs API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          responseText: errorText
        });
        
        let errorMessage = `ElevenLabs API error (${response.status}): ${errorData.message || errorData.detail?.message || response.statusText}`;
        
        // Provide specific error messages for common issues
        if (response.status === 400) {
          errorMessage = `Bad request: ${errorData.detail?.message || errorData.message || errorData.detail || 'Invalid request format or parameters'}`;
        } else if (response.status === 401) {
          errorMessage = 'Invalid API key. Please check your ElevenLabs API key.';
        } else if (response.status === 402) {
          errorMessage = 'Insufficient credits. Please check your ElevenLabs account balance.';
        } else if (response.status === 413) {
          errorMessage = 'File too large. Please use a smaller audio file.';
        } else if (response.status === 422) {
          errorMessage = 'Invalid audio format. Please use a supported audio format.';
        }
        
        throw new Error(errorMessage);
      }

      onProgress({
        stage: 'processing',
        progress: 60,
        message: 'Processing transcription...'
      });

      const result = await response.json();

      onProgress({
        stage: 'transcribing',
        progress: 90,
        message: 'Finalizing transcript...'
      });

      // Transform the ElevenLabs result to our standard format
      const transcriptionResult: TranscriptionResult = {
        id: this.generateTranscriptionId(),
        text: result.transcript || result.text || '',
        confidence: result.confidence || 0.95,
        duration: result.duration_seconds || result.duration || 0,
        language: result.detected_language || options.language || 'en',
        timestamp: new Date().toISOString(),
        chunks: result.alignment?.chars?.map((char: any) => ({
          text: char.char,
          timestamp: [char.start_time_seconds || 0, char.end_time_seconds || 0],
          confidence: char.confidence || 0.95,
        })) || null,
      };

      onProgress({
        stage: 'complete',
        progress: 100,
        message: 'Transcription completed successfully!'
      });

      return transcriptionResult;

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Transcription failed: ${error}`);
    }
  }

  /**
   * Mock transcription for development/testing when API key is not available
   */
  async mockTranscription(
    _audioBlob: Blob,
    onProgress: (progress: TranscriptionProgress) => void
  ): Promise<TranscriptionResult> {
    // Simulate API delay and progress
    onProgress({
      stage: 'uploading',
      progress: 10,
      message: 'Preparing audio for transcription...'
    });

    await this.delay(1000);

    onProgress({
      stage: 'uploading',
      progress: 30,
      message: 'Uploading audio (mock mode)...'
    });

    await this.delay(1500);

    onProgress({
      stage: 'processing',
      progress: 60,
      message: 'Processing transcription...'
    });

    await this.delay(2000);

    onProgress({
      stage: 'transcribing',
      progress: 90,
      message: 'Finalizing transcript...'
    });

    await this.delay(1000);

    // Return mock transcription result
    const mockResult: TranscriptionResult = {
      id: this.generateTranscriptionId(),
      text: "This is a mock transcription result. In a real implementation, this would contain the actual transcribed text from your audio or video file. The ElevenLabs Speech-to-Text API would process your audio and return the spoken words as text with high accuracy.",
      confidence: 0.94,
      duration: 15.7,
      language: 'en',
      timestamp: new Date().toISOString(),
      chunks: [
        {
          text: "This is a mock transcription result.",
          timestamp: [0, 3.2],
          confidence: 0.96
        },
        {
          text: "In a real implementation, this would contain the actual transcribed text from your audio or video file.",
          timestamp: [3.2, 9.8],
          confidence: 0.94
        },
        {
          text: "The ElevenLabs Speech-to-Text API would process your audio and return the spoken words as text with high accuracy.",
          timestamp: [9.8, 15.7],
          confidence: 0.92
        }
      ]
    };

    onProgress({
      stage: 'complete',
      progress: 100,
      message: 'Mock transcription completed!'
    });

    return mockResult;
  }

  /**
   * Get supported languages for transcription
   */
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'pl', name: 'Polish' },
      { code: 'tr', name: 'Turkish' },
      { code: 'ru', name: 'Russian' },
      { code: 'nl', name: 'Dutch' },
      { code: 'cs', name: 'Czech' },
      { code: 'ar', name: 'Arabic' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'hu', name: 'Hungarian' },
      { code: 'ko', name: 'Korean' },
    ];
  }

  /**
   * Estimate transcription cost (mock implementation)
   */
  estimateTranscriptionCost(durationInMinutes: number): { cost: number; currency: string } {
    // ElevenLabs pricing is typically per minute
    const costPerMinute = 0.24; // Example rate in USD
    return {
      cost: Math.round(durationInMinutes * costPerMinute * 100) / 100,
      currency: 'USD'
    };
  }

  /**
   * Generate unique transcription ID
   */
  private generateTranscriptionId(): string {
    return `transcript_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility method to create delays for mock implementation
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate audio file for transcription
   */
  validateAudioFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const supportedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size (${Math.round(file.size / (1024 * 1024))}MB) exceeds maximum limit of 100MB`
      };
    }

    if (!supportedTypes.includes(file.type) && 
        !supportedTypes.some(type => file.name.toLowerCase().includes(type.split('/')[1]))) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}. Supported formats: MP3, WAV, OGG, WebM, MP4, MOV`
      };
    }

    return { valid: true };
  }
}