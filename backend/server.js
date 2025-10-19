
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

const supabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_KEY // must be service role key, not anon!
);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    // Allow audio, video, PDF, images, and common docs
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      'application/pdf',
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
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
// Delete an upload by id
app.delete("/api/uploads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Missing upload id" });
    }
    const { error } = await supabase
      .from('uploads')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, message: "Upload deleted successfully" });
  } catch (err) {
    console.error('Delete upload error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Create demo user endpoint (optional - auth trigger handles real users)
app.post("/api/create-demo-user", async (req, res) => {
  try {
    // Get userId from request body, or use default demo ID
    const userId = req.body.userId || '123e4567-e89b-12d3-a456-426614174000';
    const email = req.body.email || 'demo@example.com';
    
    if (supabase) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingUser) {
        return res.json({
          success: true,
          message: "User already exists",
          userId: userId
        });
      }

      // Create user
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          password: 'demo123', // Required field for users table
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({
          error: "Failed to create user",
          details: error.message
        });
      }

      res.json({
        success: true,
        message: "User created successfully",
        userId: userId,
        data: data
      });
    } else {
      res.json({
        success: true,
        message: "User created (mock mode)",
        userId: userId
      });
    }
  } catch (error) {
    console.error('Error in create-demo-user:', error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});
// Upload endpoint
app.post("/api/upload", async (req, res) => {
  try {
    const { userId, type, filePath, originalName, createdAt, parsedText } = req.body;
    if (!userId || !type || !filePath || !originalName || !createdAt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from('uploads')
      .insert([
        {
          user_id: userId,
          type,
          file_path: filePath,
          original_name: originalName,
          created_at: createdAt,
          parsed_text: parsedText,
        }
      ])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get uploads for a specific user
app.get("/api/uploads/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, uploads: data });
  } catch (err) {
    console.error('Fetch uploads error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
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
      "create-demo-user": "/api/create-demo-user",
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

// Get uploads with pagination
app.get("/api/uploads", async (req, res) => {
  try {
    const { userId = 'anonymous', type, page = 1, limit = 5 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (supabase) {
      let query = supabase
        .from('uploads')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          error: "Failed to fetch uploads",
          details: error.message
        });
      }

      const totalPages = Math.ceil((count || 0) / parseInt(limit));

      res.json({
        uploads: data || [],
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount: count || 0,
          hasNext: parseInt(page) < totalPages,
          hasPrevious: parseInt(page) > 1
        }
      });
    } else {
      // Mock data when Supabase is not configured
      res.json({
        uploads: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNext: false,
          hasPrevious: false
        }
      });
    }
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// Save upload record
app.post("/api/save-upload", async (req, res) => {
  try {
    const { id, userId, type, filePath, originalName, parsedText } = req.body;

    if (!id || !userId || !type || !filePath || !originalName) {
      return res.status(400).json({
        error: "Missing required fields: id, userId, type, filePath, originalName"
      });
    }

    if (supabase) {
      const uploadData = {
        id,
        user_id: userId,
        type,
        file_path: filePath,
        original_name: originalName,
        parsed_text: parsedText || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('uploads')
        .insert(uploadData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          error: "Failed to save upload",
          details: error.message
        });
      }

      res.json({
        success: true,
        upload: data
      });
    } else {
      // Mock response when Supabase is not configured
      res.json({
        success: true,
        upload: {
          id,
          user_id: userId,
          type,
          file_path: filePath,
          original_name: originalName,
          parsed_text: parsedText || null,
          created_at: new Date().toISOString()
        },
        message: "Upload saved successfully (mock mode - Supabase not configured)"
      });
    }
  } catch (error) {
    console.error('Error saving upload:', error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});


// API route to upload a file to Supabase Storage bucket and return public URL
app.post('/api/upload-to-bucket', upload.single('file'), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!req.file || !userId) {
      return res.status(400).json({ error: 'Missing file or userId' });
    }
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    const file = req.file;
    const filePath = `${userId}/${Date.now()}_${file.originalname}`;
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, file.buffer, { upsert: true, contentType: file.mimetype });
    if (error) {
      console.error('Supabase storage upload error:', error);
      return res.status(500).json({ error: error.message });
    }
    let { publicURL } = supabase.storage.from('uploads').getPublicUrl(filePath);
    if (!publicURL) {
      // Bucket is private, generate a signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from('uploads')
        .createSignedUrl(filePath, 3600); // 1 hour
      if (signedError) {
        console.error('Supabase signed URL error:', signedError);
        return res.status(500).json({ error: signedError.message });
      }
      publicURL = signedData.signedUrl;
    }
    res.json({ success: true, publicURL, filePath });
  } catch (error) {
    console.error('Error uploading to bucket:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
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
