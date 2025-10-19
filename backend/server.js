import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Test route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend server is running",
    timestamp: new Date().toISOString(),
    supabaseConnected: !!supabase,
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "CodeRed Astra 2025 API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      transcripts: "/api/transcripts",
      upload: "/api/upload",
    },
  });
});

// Save transcript
app.post("/api/transcripts", async (req, res) => {
  try {
    const {
      id,
      text,
      confidence,
      duration,
      language,
      fileName,
      fileSize,
      fileType,
      chunks,
      userId = 'anonymous' // In a real app, get from auth
    } = req.body;

    if (!id || !text) {
      return res.status(400).json({
        error: "Missing required fields: id and text"
      });
    }

    const transcriptData = {
      id,
      user_id: userId,
      text,
      confidence,
      duration,
      language,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      chunks: chunks ? JSON.stringify(chunks) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      // Save to Supabase
      const { data, error } = await supabase
        .from('transcripts')
        .insert(transcriptData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          error: "Failed to save transcript to database",
          details: error.message
        });
      }

      res.json({
        success: true,
        data: data
      });
    } else {
      // Mock storage when Supabase is not configured
      res.json({
        success: true,
        data: transcriptData,
        message: "Transcript saved successfully (mock mode - Supabase not configured)"
      });
    }

  } catch (error) {
    console.error('Error saving transcript:', error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// Get transcripts for a user
app.get("/api/transcripts", async (req, res) => {
  try {
    const { userId = 'anonymous', limit = 50, offset = 0 } = req.query;

    if (supabase) {
      const { data, error } = await supabase
        .from('transcripts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          error: "Failed to fetch transcripts",
          details: error.message
        });
      }

      // Parse chunks back to JSON
      const transcripts = data.map(transcript => ({
        ...transcript,
        chunks: transcript.chunks ? JSON.parse(transcript.chunks) : null
      }));

      res.json({
        success: true,
        data: transcripts,
        count: transcripts.length
      });
    } else {
      // Mock data when Supabase is not configured
      res.json({
        success: true,
        data: [],
        count: 0,
        message: "No transcripts found (mock mode - Supabase not configured)"
      });
    }

  } catch (error) {
    console.error('Error fetching transcripts:', error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// Get a specific transcript
app.get("/api/transcripts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId = 'anonymous' } = req.query;

    if (supabase) {
      const { data, error } = await supabase
        .from('transcripts')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: "Transcript not found"
          });
        }
        console.error('Supabase error:', error);
        return res.status(500).json({
          error: "Failed to fetch transcript",
          details: error.message
        });
      }

      // Parse chunks back to JSON
      const transcript = {
        ...data,
        chunks: data.chunks ? JSON.parse(data.chunks) : null
      };

      res.json({
        success: true,
        data: transcript
      });
    } else {
      // Mock response when Supabase is not configured
      res.status(404).json({
        error: "Transcript not found (mock mode - Supabase not configured)"
      });
    }

  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// Delete a transcript
app.delete("/api/transcripts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId = 'anonymous' } = req.query;

    if (supabase) {
      const { error } = await supabase
        .from('transcripts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          error: "Failed to delete transcript",
          details: error.message
        });
      }

      res.json({
        success: true,
        message: "Transcript deleted successfully"
      });
    } else {
      // Mock response when Supabase is not configured
      res.json({
        success: true,
        message: "Transcript deleted successfully (mock mode - Supabase not configured)"
      });
    }

  } catch (error) {
    console.error('Error deleting transcript:', error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// File upload endpoint (for handling large audio/video files)
app.post("/api/upload", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file provided"
      });
    }

    const file = req.file;
    const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, you would:
    // 1. Save the file to cloud storage (e.g., Supabase Storage, AWS S3)
    // 2. Extract audio from video if needed
    // 3. Send to speech-to-text service
    // 4. Save the transcript to database

    res.json({
      success: true,
      fileId: fileId,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      message: "File uploaded successfully. In production, this would trigger audio processing and transcription."
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      error: "Failed to upload file",
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
