# Recent Recordings Feature Implementation

This document describes the implementation of the Recent Recordings feature with real database integration and pagination.

## Overview

The Recent Recordings feature replaces the mock data with real database integration, allowing users to browse their uploaded audio and video recordings with pagination support (max 5 recordings per page).

## New Components and Services

### 1. UploadService (`frontend/src/services/uploadService.ts`)

A service for handling API calls to the Supabase backend for uploads management.

**Features:**
- Fetch uploads with pagination and filtering
- Save new upload records to database
- Convert between database and component formats

**Key Methods:**
- `getUploads(userId, type?, page, limit)` - Fetch paginated uploads
- `saveUpload(uploadData)` - Save new upload to database
- `convertUploadFormat(upload)` - Convert DB format to component format

### 2. RecentRecordings Component (`frontend/src/components/RecentRecordings.tsx`)

A React component that displays paginated recordings from the database.

**Features:**
- Fetches real data from Supabase
- 5 recordings per page (configurable)
- Loading states and error handling
- Click to select recordings
- Empty state when no recordings found

**Props:**
- `onSelectRecording: (recording: Upload) => void` - Callback when recording is selected
- `userId?: string` - User ID to filter recordings (defaults to 'anonymous')

### 3. Pagination Component (`frontend/src/components/Pagination.tsx`)

A reusable pagination component with navigation controls.

**Features:**
- Previous/Next buttons
- Page number buttons with ellipsis for large page counts
- Shows current page range (e.g., "Showing 1-5 of 23 recordings")
- Responsive design

### 4. Backend API Endpoints

Added new endpoints to the Supabase Edge Function:

**GET `/make-server-b67fdaad/uploads`**
- Query params: `userId`, `type`, `page`, `limit`
- Returns paginated uploads with metadata

**POST `/make-server-b67fdaad/save-upload`**
- Saves upload record to database
- Required fields: `id`, `userId`, `type`, `filePath`, `originalName`
- Optional: `parsedText`

## Database Schema

### uploads Table

```sql
CREATE TABLE uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'audio', 'PDF', 'math_image')),
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  parsed_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_uploads_user_created` - For efficient user queries sorted by date
- `idx_uploads_type` - For filtering by upload type

**Security:**
- Row Level Security (RLS) enabled
- Users can only access their own uploads
- Service role can manage all uploads

## Integration Points

### 1. UploadPage Component

Updated to use the new `RecentRecordings` component in the recordings tab:

```tsx
<RecentRecordings 
  onSelectRecording={(recording) => {
    setSelectedWorkspace(convertDBUploadToUpload(recording));
  }}
  userId="user-123" // In a real app, get from auth context
/>
```

### 2. RecordingProcessor Component

Enhanced to save upload records to the database after successful transcription:

```tsx
// After transcription completes
await UploadService.saveUpload({
  id: crypto.randomUUID(),
  userId: 'user-123',
  type: selectedFile.type.startsWith('video/') ? 'video' : 'audio',
  filePath: selectedFile.name,
  originalName: selectedFile.name,
  parsedText: result.text,
});
```

## Usage

### Basic Usage

```tsx
import { RecentRecordings } from './components/RecentRecordings';

function MyComponent() {
  const [selectedRecording, setSelectedRecording] = useState(null);

  return (
    <RecentRecordings
      onSelectRecording={setSelectedRecording}
      userId="current-user-id"
    />
  );
}
```

### Testing

Use the `TestRecordingsPage` component to test the functionality:

1. Run the app and navigate to the test page
2. Click "Create Test Data" to populate the database
3. Test pagination and recording selection

## Setup Instructions

1. **Database Setup:**
   ```sql
   -- Run the SQL in database_schema.sql in Supabase SQL editor
   ```

2. **Environment Variables:**
   Ensure your Supabase credentials are configured in the backend.

3. **Dependencies:**
   All required dependencies should already be installed.

## Future Enhancements

1. **Real File Storage Integration:**
   - Upload files to Supabase Storage
   - Generate signed URLs for file access
   - Store actual file paths instead of mock paths

2. **Advanced Filtering:**
   - Filter by date range
   - Search by filename or transcript content
   - Sort options (date, name, type)

3. **Bulk Operations:**
   - Select multiple recordings
   - Bulk delete or export
   - Batch transcription processing

4. **Performance Optimizations:**
   - Virtual scrolling for large datasets
   - Caching of recent queries
   - Optimistic updates

5. **User Experience:**
   - Drag and drop reordering
   - Keyboard navigation
   - Accessibility improvements

## API Reference

### UploadService.getUploads(userId, type?, page, limit)

**Parameters:**
- `userId: string` - User ID to filter by
- `type?: string` - Optional type filter ('video', 'audio', 'PDF', 'math_image')
- `page: number` - Page number (1-based)
- `limit: number` - Items per page

**Returns:**
```typescript
{
  uploads: Upload[],
  pagination: {
    currentPage: number,
    totalPages: number,
    totalCount: number,
    hasNext: boolean,
    hasPrevious: boolean
  }
}
```

### UploadService.saveUpload(uploadData)

**Parameters:**
```typescript
{
  id: string,
  userId: string,
  type: string,
  filePath: string,
  originalName: string,
  parsedText?: string
}
```

**Returns:**
```typescript
{
  success: boolean,
  upload: Upload
}
```

## Error Handling

The components include comprehensive error handling:

- **Network Errors:** Shows user-friendly error messages
- **Empty States:** Displays helpful empty state when no recordings found
- **Loading States:** Shows loading spinners during data fetching
- **Fallback Behavior:** Gracefully handles API failures

## Security Considerations

- Row Level Security (RLS) prevents cross-user data access
- Input validation on all API endpoints
- Sanitized user inputs to prevent XSS
- Service role authentication for backend operations