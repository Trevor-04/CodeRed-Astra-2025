import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createClient } from '@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Initialize environment helper and Supabase client
function getEnv(key: string): string | undefined {
  const g: any = globalThis as any;
  if (g?.Deno?.env?.get) {
    return g.Deno.env.get(key);
  }
  if (typeof process !== 'undefined' && process?.env) {
    return (process.env as any)[key];
  }
  return g?.[key];
}

// Initialize Supabase client
const SUPABASE_URL = getEnv('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// Initialize storage bucket
const BUCKET_NAME = 'make-b67fdaad-stemvoice-uploads';

async function initializeBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
  
  if (!bucketExists) {
    console.log('Creating storage bucket:', BUCKET_NAME);
    await supabase.storage.createBucket(BUCKET_NAME, { public: false });
  }
}

// Initialize on startup
initializeBucket().catch(console.error);

// Upload file endpoint
app.post('/make-server-b67fdaad/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileId = crypto.randomUUID();
    const fileName = `${fileId}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Error uploading file to storage:', error);
      return c.json({ error: `Storage upload error: ${error.message}` }, 500);
    }

    // Get signed URL for the file
    const { data: signedUrlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 3600); // 1 hour

    return c.json({
      fileId,
      fileName,
      fileUrl: signedUrlData?.signedUrl || '',
      originalName: file.name
    });

  } catch (error) {
    console.error('Error in upload endpoint:', error);
    return c.json({ error: `Upload processing error: ${error}` }, 500);
  }
});

// Process OCR endpoint (using Mathpix API)
app.post('/make-server-b67fdaad/process-ocr', async (c) => {
  try {
    const { fileUrl } = await c.req.json();

    if (!fileUrl) {
      return c.json({ error: 'No file URL provided' }, 400);
    }

    const mathpixAppId = getEnv('MATHPIX_APP_ID');
    const mathpixAppKey = getEnv('MATHPIX_APP_KEY');

    if (!mathpixAppId || !mathpixAppKey) {
      console.error('Mathpix API credentials not configured');
      return c.json({ 
        error: 'Mathpix API credentials not configured. Please add MATHPIX_APP_ID and MATHPIX_APP_KEY environment variables.',
        extractedText: 'E = mc²\n\nThis is Einstein\'s famous equation relating energy (E) to mass (m) and the speed of light (c).',
        mathContent: 'E = mc²',
        isDemo: true
      });
    }

    // Call Mathpix OCR API
    const response = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'app_id': mathpixAppId,
        'app_key': mathpixAppKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        src: fileUrl,
        formats: ['text', 'latex_styled'],
        data_options: {
          include_asciimath: true,
          include_latex: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mathpix API error response:', errorText);
      return c.json({ 
        error: `Mathpix API error: ${response.status} - ${errorText}`,
        extractedText: 'E = mc²\n\nThis is Einstein\'s famous equation relating energy (E) to mass (m) and the speed of light (c).',
        mathContent: 'E = mc²',
        isDemo: true
      });
    }

    const data = await response.json();
    
    return c.json({
      extractedText: data.text || '',
      mathContent: data.latex_styled || data.text || '',
      rawData: data
    });

  } catch (error) {
    console.error('Error in OCR processing endpoint:', error);
    return c.json({ 
      error: `OCR processing error: ${error}`,
      extractedText: 'E = mc²\n\nThis is Einstein\'s famous equation relating energy (E) to mass (m) and the speed of light (c).',
      mathContent: 'E = mc²',
      isDemo: true
    });
  }
});

// Synthesize speech endpoint (using ElevenLabs API)
app.post('/make-server-b67fdaad/synthesize', async (c) => {
  try {
    const { text, voiceSpeed = 1.0 } = await c.req.json();

    if (!text) {
      return c.json({ error: 'No text provided for synthesis' }, 400);
    }

    const elevenlabsApiKey = getEnv('ELEVENLABS_API_KEY');

    if (!elevenlabsApiKey) {
      console.error('ElevenLabs API key not configured');
      // Return a demo audio URL (silent audio data URL)
      const demoAudioUrl = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAYQAAAAAAAP/7kGQAAANUMEoFPeACAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZDiAAABpBwAAAgAAA0gAAABAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';
      return c.json({
        audioUrl: demoAudioUrl,
        isDemo: true,
        message: 'ElevenLabs API key not configured. Please add ELEVENLABS_API_KEY environment variable. Using demo audio.'
      });
    }

    // Call ElevenLabs Text-to-Speech API
    // Using voice ID for Rachel (default voice)
    const voiceId = '21m00Tcm4TlvDq8ikWAM';
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: voiceSpeed
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error response:', errorText);
      const demoAudioUrl = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAYQAAAAAAAP/7kGQAAANUMEoFPeACAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZDiAAABpBwAAAgAAA0gAAABAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';
      return c.json({
        audioUrl: demoAudioUrl,
        isDemo: true,
        error: `ElevenLabs API error: ${response.status} - ${errorText}`
      });
    }

    // Get audio data and convert to base64
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    return c.json({
      audioUrl
    });

  } catch (error) {
    console.error('Error in synthesis endpoint:', error);
    const demoAudioUrl = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAYQAAAAAAAP/7kGQAAANUMEoFPeACAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZDiAAABpBwAAAgAAA0gAAABAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';
    return c.json({ 
      error: `Speech synthesis error: ${error}`,
      audioUrl: demoAudioUrl,
      isDemo: true
    });
  }
});

// Save lesson endpoint
app.post('/make-server-b67fdaad/save-lesson', async (c) => {
  try {
    const { title, extractedText, mathContent, audioUrl } = await c.req.json();

    const lessonId = crypto.randomUUID();
    const lesson = {
      id: lessonId,
      title,
      extractedText,
      mathContent,
      audioUrl,
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      createdAt: new Date().toISOString()
    };

    await kv.set(`lesson:${lessonId}`, lesson);

    // Add to lessons list
    const lessonsList = await kv.get('lessons:list') || [];
    lessonsList.unshift(lessonId);
    await kv.set('lessons:list', lessonsList);

    return c.json({ success: true, lessonId, lesson });

  } catch (error) {
    console.error('Error in save-lesson endpoint:', error);
    return c.json({ error: `Error saving lesson: ${error}` }, 500);
  }
});

// Get all lessons endpoint
app.get('/make-server-b67fdaad/lessons', async (c) => {
  try {
    const lessonsList = await kv.get('lessons:list') || [];
    const lessons = [];

    for (const lessonId of lessonsList) {
      const lesson = await kv.get(`lesson:${lessonId}`);
      if (lesson) {
        lessons.push(lesson);
      }
    }

    return c.json({ lessons });

  } catch (error) {
    console.error('Error in get lessons endpoint:', error);
    return c.json({ error: `Error retrieving lessons: ${error}` }, 500);
  }
});

// Delete lesson endpoint
app.delete('/make-server-b67fdaad/lessons/:id', async (c) => {
  try {
    const lessonId = c.req.param('id');

    await kv.del(`lesson:${lessonId}`);

    // Remove from lessons list
    const lessonsList = await kv.get('lessons:list') || [];
    const updatedList = lessonsList.filter((id: string) => id !== lessonId);
    await kv.set('lessons:list', updatedList);

    return c.json({ success: true });

  } catch (error) {
    console.error('Error in delete lesson endpoint:', error);
    return c.json({ error: `Error deleting lesson: ${error}` }, 500);
  }
});

// Get uploads endpoint with pagination
app.get('/make-server-b67fdaad/uploads', async (c) => {
  try {
    const userId = c.req.query('userId') || 'anonymous';
    const type = c.req.query('type'); // Filter by type (video, audio, PDF, math_image)
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '5');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching uploads:', error);
      return c.json({ error: `Database error: ${error.message}` }, 500);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      uploads: data || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count || 0,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    });

  } catch (error) {
    console.error('Error in uploads endpoint:', error);
    return c.json({ error: `Error fetching uploads: ${error}` }, 500);
  }
});

// Save upload record to database
app.post('/make-server-b67fdaad/save-upload', async (c) => {
  try {
    const { 
      id, 
      userId, 
      type, 
      filePath, 
      originalName, 
      parsedText 
    } = await c.req.json();

    if (!id || !userId || !type || !filePath || !originalName) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

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
      console.error('Error saving upload:', error);
      return c.json({ error: `Database error: ${error.message}` }, 500);
    }

    return c.json({ success: true, upload: data });

  } catch (error) {
    console.error('Error in save-upload endpoint:', error);
    return c.json({ error: `Error saving upload: ${error}` }, 500);
  }
});

// Health check
app.get('/make-server-b67fdaad/health', (c) => {
  return c.json({ status: 'healthy', service: 'STEMVoice API' });
});

const deno = (globalThis as any).Deno;
if (deno && typeof deno.serve === 'function') {
  // Running in a Deno environment
  deno.serve(app.fetch);
} else if (typeof (app as any).listen === 'function') {
  // Likely running in Node (hono supports app.listen in Node)
  const port = Number(getEnv('PORT') || '8787');
  (async () => {
    try {
      await (app as any).listen({ port });
      console.log(`Server listening on http://localhost:${port}`);
    } catch (err) {
      console.error('Failed to start server:', err);
    }
  })();
} else {
  // No direct runtime to start the server; export the app for the host to consume
  console.warn('No runtime found for auto-starting the server; exporting app for external host to use.');
}

export default app;
