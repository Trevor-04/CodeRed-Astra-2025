/**
 * Audio Processing Service
 * Handles audio extraction from video files and audio format conversion
 */

export interface AudioExtractionProgress {
  stage: 'loading' | 'extracting' | 'converting' | 'complete';
  progress: number;
  message: string;
}

export class AudioProcessingService {
  private static instance: AudioProcessingService;

  static getInstance(): AudioProcessingService {
    if (!AudioProcessingService.instance) {
      AudioProcessingService.instance = new AudioProcessingService();
    }
    return AudioProcessingService.instance;
  }

  /**
   * Extract audio from video file or process audio file for transcription
   * @param file - The audio or video file
   * @param onProgress - Progress callback
   * @returns Promise<Blob> - The processed audio blob
   */
  async processAudioFile(
    file: File,
    onProgress: (progress: AudioExtractionProgress) => void
  ): Promise<Blob> {
    try {
      onProgress({
        stage: 'loading',
        progress: 10,
        message: 'Loading file...'
      });

      // Validate file type
      if (!this.isValidAudioVideoFile(file)) {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      onProgress({
        stage: 'extracting',
        progress: 30,
        message: 'Extracting audio...'
      });

      // If it's already an audio file, process it directly
      if (file.type.startsWith('audio/')) {
        return await this.processAudioDirectly(file, onProgress);
      }

      // If it's a video file, extract audio
      return await this.extractAudioFromVideo(file, onProgress);

    } catch (error) {
      throw new Error(`Audio processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process audio file directly
   */
  private async processAudioDirectly(
    file: File,
    onProgress: (progress: AudioExtractionProgress) => void
  ): Promise<Blob> {
    onProgress({
      stage: 'converting',
      progress: 70,
      message: 'Converting audio format...'
    });

    // Convert to optimal format for speech-to-text (MP3 or WAV)
    const audioBlob = await this.convertAudioFormat(file);

    onProgress({
      stage: 'complete',
      progress: 100,
      message: 'Audio processing complete'
    });

    return audioBlob;
  }

  /**
   * Extract audio from video file using Web Audio API
   */
  private async extractAudioFromVideo(
    file: File,
    onProgress: (progress: AudioExtractionProgress) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';
      
      video.addEventListener('loadedmetadata', async () => {
        try {
          onProgress({
            stage: 'extracting',
            progress: 50,
            message: 'Processing video...'
          });

          // Create audio source from video
          const source = audioContext.createMediaElementSource(video);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);

          // Start recording
          const mediaRecorder = new MediaRecorder(destination.stream, {
            mimeType: 'audio/webm'
          });

          const audioChunks: Blob[] = [];
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunks.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            onProgress({
              stage: 'converting',
              progress: 80,
              message: 'Converting audio format...'
            });

            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const convertedBlob = await this.convertAudioFormat(audioBlob);
            
            onProgress({
              stage: 'complete',
              progress: 100,
              message: 'Audio extraction complete'
            });

            // Cleanup
            URL.revokeObjectURL(video.src);
            audioContext.close();
            
            resolve(convertedBlob);
          };

          mediaRecorder.onerror = (error) => {
            reject(new Error(`Recording failed: ${error}`));
          };

          // Start recording and play video
          mediaRecorder.start();
          await video.play();

          // Stop recording when video ends
          video.addEventListener('ended', () => {
            mediaRecorder.stop();
          });

        } catch (error) {
          reject(error);
        }
      });

      video.addEventListener('error', () => {
        reject(new Error('Failed to load video file'));
      });
    });
  }

  /**
   * Convert audio to optimal format for speech-to-text
   */
  private async convertAudioFormat(audioBlob: Blob): Promise<Blob> {
    // For now, return the blob as-is
    // In a production environment, you might want to use FFmpeg.js or similar
    // to ensure optimal audio format and quality
    return audioBlob;
  }

  /**
   * Validate if file is a supported audio or video format
   */
  private isValidAudioVideoFile(file: File): boolean {
    const supportedTypes = [
      // Audio formats
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/m4a',
      'audio/aac',
      // Video formats
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
      'video/quicktime',
      'video/x-msvideo'
    ];

    return supportedTypes.includes(file.type) || 
           supportedTypes.some(type => file.name.toLowerCase().includes(type.split('/')[1]));
  }

  /**
   * Get human-readable file size
   */
  getFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get estimated processing time based on file size
   */
  getEstimatedProcessingTime(file: File): string {
    const sizeInMB = file.size / (1024 * 1024);
    const estimatedMinutes = Math.ceil(sizeInMB / 10); // Rough estimate: 1 minute per 10MB
    return estimatedMinutes === 1 ? '1 minute' : `${estimatedMinutes} minutes`;
  }
}