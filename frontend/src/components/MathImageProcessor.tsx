import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { AudioPlayer } from './AudioPlayer';
import { Alert, AlertDescription } from './ui/alert';
import { publicAnonKey } from '../../utils/supabase/info';

interface MathImageProcessorProps {
  onProcessingComplete?: (result: {
    fileId: string;
    fileName: string;
    extractedText: string;
    mathContent: string;
    audioUrl: string;
  }) => void;
  onError?: (error: string) => void;
  voiceSpeed: number;
}

interface ProcessingResult {
  fileId: string;
  fileName: string;
  fileUrl: string;
  extractedText: string;
  mathContent: string;
  audioUrl: string;
  isDemo?: boolean;
  readableText?: string;
}

export function MathImageProcessor({ onProcessingComplete, onError, voiceSpeed }: MathImageProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = 'https://bzrpuvripwivsiongdst.supabase.co/functions/v1/make-server-b67fdaad';

  const convertLatexToSpeech = (latex: string, plainText: string): string => {
    // If we have plain text that's readable, prefer it
    if (plainText && plainText.length > 10 && !plainText.includes('\\')) {
      return plainText;
    }

    // Convert common LaTeX symbols to readable text
    let readable = latex;
    
    // Fractions
    readable = readable.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) divided by ($2)');
    
    // Superscripts (powers)
    readable = readable.replace(/\^(\d+)/g, ' to the power of $1');
    readable = readable.replace(/\^{([^}]+)}/g, ' to the power of ($1)');
    
    // Subscripts
    readable = readable.replace(/_(\d+)/g, ' subscript $1');
    readable = readable.replace(/_{([^}]+)}/g, ' subscript ($1)');
    
    // Square roots
    readable = readable.replace(/\\sqrt\{([^}]+)\}/g, 'square root of ($1)');
    readable = readable.replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, '$1th root of ($2)');
    
    // Greek letters
    const greekLetters: Record<string, string> = {
      '\\alpha': 'alpha',
      '\\beta': 'beta',
      '\\gamma': 'gamma',
      '\\delta': 'delta',
      '\\epsilon': 'epsilon',
      '\\theta': 'theta',
      '\\lambda': 'lambda',
      '\\mu': 'mu',
      '\\pi': 'pi',
      '\\sigma': 'sigma',
      '\\phi': 'phi',
      '\\omega': 'omega',
      '\\Delta': 'Delta',
      '\\Gamma': 'Gamma',
      '\\Lambda': 'Lambda',
      '\\Omega': 'Omega',
      '\\Phi': 'Phi',
      '\\Pi': 'Pi',
      '\\Sigma': 'Sigma',
      '\\Theta': 'Theta'
    };
    
    Object.entries(greekLetters).forEach(([latex, spoken]) => {
      readable = readable.replace(new RegExp(latex.replace('\\', '\\\\'), 'g'), spoken);
    });
    
    // Mathematical operators
    const operators: Record<string, string> = {
      '\\cdot': ' times ',
      '\\times': ' times ',
      '\\div': ' divided by ',
      '\\pm': ' plus or minus ',
      '\\mp': ' minus or plus ',
      '\\leq': ' less than or equal to ',
      '\\geq': ' greater than or equal to ',
      '\\neq': ' not equal to ',
      '\\approx': ' approximately equal to ',
      '\\equiv': ' equivalent to ',
      '\\propto': ' proportional to ',
      '\\infty': 'infinity',
      '\\sum': 'sum of',
      '\\prod': 'product of',
      '\\int': 'integral of',
      '\\partial': 'partial',
      '\\nabla': 'nabla',
      '\\in': ' in ',
      '\\subset': ' subset of ',
      '\\supset': ' superset of ',
      '\\cup': ' union ',
      '\\cap': ' intersection ',
      '\\lim': 'limit of',
      '\\sin': 'sine of',
      '\\cos': 'cosine of',
      '\\tan': 'tangent of',
      '\\log': 'log of',
      '\\ln': 'natural log of',
      '\\exp': 'exponential of'
    };
    
    Object.entries(operators).forEach(([latex, spoken]) => {
      readable = readable.replace(new RegExp(latex.replace('\\', '\\\\'), 'g'), spoken);
    });
    
    // Clean up common LaTeX formatting
    readable = readable.replace(/\\\\/g, ', '); // Line breaks
    readable = readable.replace(/\\text\{([^}]+)\}/g, '$1'); // Text blocks
    readable = readable.replace(/\\mathrm\{([^}]+)\}/g, '$1'); // Math roman
    readable = readable.replace(/\\mathbf\{([^}]+)\}/g, '$1'); // Bold
    readable = readable.replace(/\\mathit\{([^}]+)\}/g, '$1'); // Italic
    readable = readable.replace(/\$+/g, ''); // Remove dollar signs
    readable = readable.replace(/[{}]/g, ''); // Remove braces
    readable = readable.replace(/\\/g, ''); // Remove remaining backslashes
    
    // Clean up spacing
    readable = readable.replace(/\s+/g, ' ').trim();
    
    // If the result is still mostly symbols or very short, add context
    if (readable.length < 5 || /^[^a-zA-Z]*$/.test(readable)) {
      return `The mathematical expression: ${readable}`;
    }
    
    return readable;
  };

  const getHeaders = (includeContentType = true) => {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${publicAnonKey}`,
      'apikey': publicAnonKey,
    };
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];
    if (!validTypes.includes(file.type)) {
      const errorMsg = 'Please upload a valid image file (JPG, PNG, or HEIC)';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Upload the image
      setProcessingStep('Uploading image...');
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload successful:', uploadData);

      // Step 2: Process with Mathpix OCR
      setProcessingStep('Extracting math content with Mathpix OCR...');
      const ocrResponse = await fetch(`${API_BASE_URL}/process-ocr`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          fileUrl: uploadData.fileUrl,
        }),
      });

      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        throw new Error(`OCR processing failed: ${ocrResponse.status} ${ocrResponse.statusText} - ${errorText}`);
      }

      const ocrData = await ocrResponse.json();
      console.log('OCR successful:', ocrData);

      // Step 3: Generate audio with ElevenLabs TTS
      setProcessingStep('Generating audio with ElevenLabs TTS...');
      
      // Convert LaTeX to readable speech
      const readableText = convertLatexToSpeech(
        ocrData.mathContent || ocrData.extractedText || '',
        ocrData.extractedText || ''
      );
      
      console.log('Original LaTeX:', ocrData.mathContent);
      console.log('Readable text for TTS:', readableText);
      
      const ttsResponse = await fetch(`${API_BASE_URL}/synthesize`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          text: readableText,
          voiceSpeed: voiceSpeed,
        }),
      });

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        throw new Error(`TTS failed: ${ttsResponse.status} ${ttsResponse.statusText} - ${errorText}`);
      }

      const ttsData = await ttsResponse.json();
      console.log('TTS successful:', ttsData);

      // Combine all results
      const readableForDisplay = convertLatexToSpeech(
        ocrData.mathContent || ocrData.extractedText || '',
        ocrData.extractedText || ''
      );
      
      const finalResult: ProcessingResult = {
        fileId: uploadData.fileId,
        fileName: uploadData.originalName,
        fileUrl: uploadData.fileUrl,
        extractedText: ocrData.extractedText || '',
        mathContent: ocrData.mathContent || '',
        audioUrl: ttsData.audioUrl || '',
        isDemo: ocrData.isDemo || ttsData.isDemo,
        readableText: readableForDisplay, // Add readable version
      };

      // Save as a lesson if we have audio
      if (finalResult.audioUrl && !finalResult.isDemo) {
        try {
          setProcessingStep('Saving lesson...');
          const lessonResponse = await fetch(`${API_BASE_URL}/save-lesson`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              title: finalResult.fileName || 'Math Equation',
              extractedText: finalResult.extractedText,
              mathContent: finalResult.mathContent,
              audioUrl: finalResult.audioUrl
            })
          });

          if (lessonResponse.ok) {
            console.log('✅ Lesson saved successfully');
          } else {
            console.warn('⚠️ Failed to save lesson:', await lessonResponse.text());
          }
        } catch (error) {
          console.error('❌ Error saving lesson:', error);
        }
      }

      setResult(finalResult);
      setProcessingStep('Complete!');
      
      onProcessingComplete?.({
        fileId: finalResult.fileId,
        fileName: finalResult.fileName,
        extractedText: finalResult.extractedText,
        mathContent: finalResult.mathContent,
        audioUrl: finalResult.audioUrl,
      });

    } catch (error) {
      console.error('Processing error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetProcessor = () => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
    setProcessingStep('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      {!result && !isProcessing && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-green-400 transition-colors cursor-pointer"
          onClick={triggerFileInput}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">∑</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-1">
                Drop math images here
              </p>
              <p className="text-gray-600">
                Supports JPG, PNG, HEIC (handwritten or printed equations)
              </p>
            </div>
            <Button className="bg-green-600 p-4 cursor-pointer hover:bg-green-700 text-white">
              Browse Images
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/heic"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="font-semibold text-green-700">Processing Math Image</p>
                <p className="text-sm text-gray-600">{processingStep}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>1. Upload image to storage</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${processingStep.includes('OCR') ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span>2. Extract math content with Mathpix OCR</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${processingStep.includes('audio') ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span>3. Generate audio with ElevenLabs TTS</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            <strong>Error:</strong> {error}
            <Button
              onClick={resetProcessor}
              className="ml-4 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Processing Results */}
      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-700">
                    ✅ Math Content Processed Successfully
                  </h3>
                  <p className="text-sm text-gray-600">
                    File: {result.fileName}                    
                  </p>
                </div>
                <Button
                  onClick={resetProcessor}
                  variant="outline"
                  className="border-green-600 cursor-pointer text-green-600 hover:bg-green-50"
                >
                  Process Another Image
                </Button>
              </div>

              {/* Extracted Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Extracted Text */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Extracted Text:</h4>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {result.extractedText || 'No text extracted'}
                    </p>
                  </div>
                </div>

                {/* Math Content (LaTeX) */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">LaTeX Math:</h4>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <code className="text-sm text-gray-700 whitespace-pre-wrap">
                      {result.mathContent || 'No math content found'}
                    </code>
                  </div>
                </div>
              </div>

              {/* Readable Version for Audio */}
              {result.readableText && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Readable Version (for Audio):</h4>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">
                      "{result.readableText}"
                    </p>
                  </div>
                </div>
              )}

              {/* Audio Player */}
              {result.audioUrl && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Audio Reading:</h4>
                  <AudioPlayer
                    audioUrl={result.audioUrl}
                    extractedText={result.extractedText}
                    mathContent={result.mathContent}
                    lessonId={result.fileId}
                    highlightAsSpoken={true}
                    onBack={() => {}}
                  />
                </div>
              )}                            
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}