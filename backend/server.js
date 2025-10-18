import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mathpixRoutes from './routes/mathpix.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Your Mathpix → Gemini → Voice Pipeline Routes
app.use('/api/mathpix', mathpixRoutes);

// Test endpoint to verify API keys are loaded
app.get('/api/test-config', (req, res) => {
  res.json({
    mathpixConfigured: !!process.env.MATHPIX_APP_ID && !!process.env.MATHPIX_APP_KEY,
    elevenlabsConfigured: !!process.env.ELEVENLABS_API_KEY,
    message: 'Check if API keys are loaded (keys are hidden for security)'
  });
});

// Error handling middleware
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
║  Available Routes:                     ║
║  - GET  /api/health                    ║
║  - GET  /api/test-config               ║
║  - POST /api/mathpix/extract           ║
║  - POST /api/mathpix/complete-pipeline ║
║  - POST /api/mathpix/handle-option     ║
║  - POST /api/mathpix/text-to-speech    ║
╚════════════════════════════════════════╝
  `);
});

export default app;