import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import axios from 'axios';

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Step 1: Upload image and extract text using Mathpix OCR
 * POST /api/mathpix/extract
 */
router.post('/extract', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('Processing image with Mathpix...');

    // Call Mathpix OCR API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    
    // Mathpix options for STEM content
    formData.append('options_json', JSON.stringify({
      math_inline_delimiters: ['$', '$'],
      math_display_delimiters: ['$$', '$$'],
      rm_spaces: true,
      numbers_default_to_math: true,
    }));

    const mathpixResponse = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'app_id': process.env.MATHPIX_APP_ID,
        'app_key': process.env.MATHPIX_APP_KEY,
      },
      body: formData,
    });

    if (!mathpixResponse.ok) {
      const errorText = await mathpixResponse.text();
      console.error('Mathpix API error:', errorText);
      throw new Error(`Mathpix API error: ${mathpixResponse.statusText}`);
    }

    const mathpixData = await mathpixResponse.json();
    console.log('Mathpix extraction successful');

    // Return extracted text and LaTeX
    res.json({
      success: true,
      extractedText: mathpixData.text || '',
      latex: mathpixData.latex_styled || '',
      confidence: mathpixData.confidence || 0,
      rawData: mathpixData,
    });
  } catch (error) {
    console.error('Mathpix extraction error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Step 2: Send extracted text to Gemini and present options
 * POST /api/mathpix/process-with-gemini
 */
router.post('/process-with-gemini', async (req, res) => {
  try {
    const { extractedText } = req.body;

    if (!extractedText) {
      return res.status(400).json({ error: 'No extracted text provided' });
    }

    console.log('Sending to Gemini AI...');

    // Call your AI backend to process with Gemini
    const geminiResponse = await axios.post('http://localhost:8000/present-options', {
      text: extractedText,
    });

    res.json({
      success: true,
      options: geminiResponse.data.options,
      message: geminiResponse.data.message,
    });
  } catch (error) {
    console.error('Gemini processing error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Step 3: Handle user's voice command (option 1, 2, 3, or 4)
 * POST /api/mathpix/handle-option
 */
router.post('/handle-option', async (req, res) => {
  try {
    const { option, extractedText, customInput } = req.body;

    if (!option || !extractedText) {
      return res.status(400).json({ error: 'Missing option or text' });
    }

    console.log(`Processing option ${option}...`);

    // Call AI backend with the selected option
    const geminiResponse = await axios.post('http://localhost:8000/handle-user-choice', {
      option: option,
      text: extractedText,
      custom_input: customInput || null,
    });

    res.json({
      success: true,
      result: geminiResponse.data.result,
      textToSpeak: geminiResponse.data.text_to_speak,
    });
  } catch (error) {
    console.error('Option handling error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Step 4: Convert text to speech using ElevenLabs
 * POST /api/mathpix/text-to-speech
 */
router.post('/text-to-speech', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    console.log('Converting to speech with ElevenLabs...');

    // ElevenLabs API call
    const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Sarah voice (clear for educational content)
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        responseType: 'arraybuffer',
      }
    );

    // Return audio file
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error('Text-to-speech error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Complete pipeline: Image → Mathpix → Gemini → Options
 * POST /api/mathpix/complete-pipeline
 */
router.post('/complete-pipeline', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Step 1: Extract text with Mathpix
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('options_json', JSON.stringify({
      math_inline_delimiters: ['$', '$'],
      math_display_delimiters: ['$$', '$$'],
      rm_spaces: true,
    }));

    const mathpixResponse = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'app_id': process.env.MATHPIX_APP_ID,
        'app_key': process.env.MATHPIX_APP_KEY,
      },
      body: formData,
    });

    const mathpixData = await mathpixResponse.json();
    const extractedText = mathpixData.text || '';

    // Step 2: Process with Gemini and get options
    const geminiResponse = await axios.post('http://localhost:8000/present-options', {
      text: extractedText,
    });

    res.json({
      success: true,
      extractedText: extractedText,
      latex: mathpixData.latex_styled || '',
      options: geminiResponse.data.options,
      message: geminiResponse.data.message,
    });
  } catch (error) {
    console.error('Complete pipeline error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;