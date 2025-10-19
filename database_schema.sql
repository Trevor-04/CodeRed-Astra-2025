-- Database Schema Reference for STEMVoice Application
-- This schema already exists in the Supabase database

-- The uploads table is used for the Recent Recordings feature
-- Structure:
-- - id: TEXT (Primary Key) - Unique identifier for the upload
-- - user_id: TEXT - Links to the user who uploaded the file
-- - type: VARCHAR - Type of upload (video, audio, PDF, math_image)
-- - file_path: VARCHAR - Path to the stored file
-- - original_name: VARCHAR - Original filename as uploaded by user
-- - created_at: TIMESTAMPTZ - When the upload was created
-- - parsed_text: TEXT - Extracted/transcribed text content

-- Additional tables in the schema:
-- - users: For user management
-- - upload_chunks: For storing file chunks during upload
-- - kv_store_b67fdaad: For key-value storage used by the application

-- The uploads table supports our Recent Recordings feature with:
-- - Pagination queries (ORDER BY created_at DESC)
-- - Type filtering (WHERE type IN ('video', 'audio'))
-- - User isolation (WHERE user_id = ?)

-- Sample query for Recent Recordings:
-- SELECT * FROM uploads 
-- WHERE user_id = ? AND type IN ('video', 'audio')
-- ORDER BY created_at DESC 
-- LIMIT 5 OFFSET ?;