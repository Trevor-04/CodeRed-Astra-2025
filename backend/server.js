import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend server is running",
    timestamp: new Date().toISOString(),
  });
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
    },
  });
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
