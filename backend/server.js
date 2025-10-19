import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// ===========================================
// TEAM'S FRONTEND ENDPOINTS
// ===========================================

// Upload endpoint for team's frontend
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Processing upload from frontend...');

    // Process with Mathpix OCR
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    
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
      throw new Error(`Mathpix API error: ${mathpixResponse.statusText}`);
    }

    const mathpixData = await mathpixResponse.json();
    const extractedText = mathpixData.text || '';

    console.log('Mathpix extraction successful');

    // Send to Gemini AI for initial analysis
    const aiResponse = await axios.post('http://localhost:8000/present-options', {
      text: extractedText,
    });

    // Return response in format team's frontend expects
    res.json({
      success: true,
      id: Date.now().toString(), // Generate a simple ID
      filename: req.file.originalname,
      extractedContent: extractedText,
      latex: mathpixData.latex_styled || '',
      aiMessage: aiResponse.data.message,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// AI Assistant endpoints for Summary/Quiz/Explain buttons
app.post('/api/ai/summary', async (req, res) => {
  try {
    const { text } = req.body;
    
    const response = await axios.post('http://localhost:8000/handle-user-choice', {
      option: 1, // Explain option
      text: text,
    });

    res.json({
      success: true,
      summary: response.data.result.content || response.data.result.text_to_speak,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/quiz', async (req, res) => {
  try {
    const { text } = req.body;
    
    const response = await axios.post('http://localhost:8000/handle-user-choice', {
      option: 2, // Quiz option
      text: text,
    });

    res.json({
      success: true,
      questions: response.data.result.questions || [],
      message: response.data.result.text_to_speak,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Evaluate quiz answers at the end
app.post('/api/ai/evaluate-quiz', async (req, res) => {
  try {
    const { quiz_questions, user_answers, original_content } = req.body;
    
    const response = await axios.post('http://localhost:8000/evaluate-quiz-answers', {
      quiz_questions,
      user_answers,
      original_content,
    });

    res.json({
      success: true,
      evaluation: response.data.evaluation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/explain', async (req, res) => {
  try {
    const { text } = req.body;
    
    const response = await axios.post('http://localhost:8000/handle-user-choice', {
      option: 1, // Explain option
      text: text,
    });

    res.json({
      success: true,
      explanation: response.data.result.content || response.data.result.text_to_speak,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Text-to-Speech endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Sarah voice
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
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

    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// YOUR MATHPIX ROUTES (for test_pipeline.html)
// ===========================================

// Import your mathpix routes
import mathpixRoutes from './routes/mathpix.js';
app.use('/api/mathpix', mathpixRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  Backend Server Running Successfully   ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                         
║  URL: http://localhost:${PORT}         
║                                        ║
║  Team's Frontend Endpoints:            ║
║  - POST /api/upload                    ║
║  - POST /api/ai/summary                ║
║  - POST /api/ai/quiz                   ║
║  - POST /api/ai/explain                ║
║  - POST /api/tts                       ║
║                                        ║
║  Your Mathpix Endpoints:               ║
║  - POST /api/mathpix/extract           ║
║  - POST /api/mathpix/complete-pipeline ║
║  - POST /api/mathpix/handle-option     ║
║  - POST /api/mathpix/text-to-speech    ║
╚════════════════════════════════════════╝
  `);
});

export default app;