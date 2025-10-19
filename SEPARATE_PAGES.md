# Separate Pages Refactor - Documentation

## Overview

Refactored the upload functionality and past lessons into separate page components for better code organization and modularity.

## Changes Made

### 1. Created New Components

#### UploadPage Component (`frontend/src/components/UploadPage.tsx`)

- **Purpose**: Dedicated page for file uploads with three tabs (Notes, Recordings, Math)
- **Features**:

  - Self-contained state management for selected workspace
  - Three upload tabs with drag-and-drop areas
  - Recent uploads list for each file type
  - Integration with Workspace component for AI chat
  - Back button to return to dashboard

- **Props**:

  ```typescript
  interface UploadPageProps {
    onBack: () => void;
    onUpload: (file: File) => void;
    mockUploads: Upload[];
    mockExtractedContent: Record<string, string>;
  }
  ```

- **Responsibilities**:
  - Manage workspace selection state
  - Display upload areas for each file type
  - Show recent uploads filtered by type
  - Handle navigation between upload list and workspace view

### 2. Updated Existing Components

#### App.tsx

- **Removed**:
  - All inline upload tab JSX (moved to UploadPage)
  - Unused imports: `UploadArea`, `Workspace`, `Tabs`, `Card` components
  - `selectedWorkspace` state (now managed in UploadPage)
- **Simplified**:

  - Upload screen now renders single `<UploadPage />` component
  - Cleaner navigation logic
  - Reduced file size from ~811 lines to ~513 lines

- **Maintained**:
  - Mock data definitions (mockUploads, mockExtractedContent)
  - Upload handler functions
  - All other screen navigation (Dashboard, PastLessons, AudioPlayer, etc.)

#### PastLessons Component

- **Status**: Already works as standalone page
- **No changes needed**
- **Features**:
  - Own layout with back button
  - List of past lessons
  - Play and delete actions

## User Flow

### Upload Flow

1. User clicks "Upload Notes or Equations" on Dashboard
2. App navigates to Upload screen
3. UploadPage component renders with 3 tabs
4. User selects tab (Notes/Recordings/Math)
5. User can:
   - Upload new files via drag-and-drop
   - Click on recent uploads to open workspace
6. When workspace opens:
   - File content displays on left
   - AI chatbot displays on right
   - Back button returns to upload list
7. User clicks "Back to Dashboard" to return home

### Past Lessons Flow

1. User clicks "Listen to Past Lessons" on Dashboard
2. App navigates to Lessons screen
3. PastLessons component renders as full page
4. User can:
   - View all past lessons
   - Play any lesson
   - Delete lessons
5. User clicks "Back to Dashboard" to return home

## Benefits

### Code Organization

- ✅ Separation of concerns - each page is self-contained
- ✅ Easier to maintain and test individual pages
- ✅ Cleaner App.tsx with less nested JSX
- ✅ Reusable components with clear props interfaces

### User Experience

- ✅ Dedicated pages for different workflows
- ✅ Clear navigation with back buttons
- ✅ Consistent layout patterns
- ✅ Better focus on specific tasks

### Development

- ✅ Easier to add new features to specific pages
- ✅ Simpler to debug isolated components
- ✅ Better TypeScript type safety with defined props
- ✅ Reduced cognitive load when reading code

## File Structure

```
frontend/src/
├── App.tsx (simplified - main navigation)
├── components/
│   ├── Dashboard.tsx (landing page with 2 main buttons)
│   ├── UploadPage.tsx (NEW - dedicated upload page)
│   ├── PastLessons.tsx (standalone lessons page)
│   ├── Workspace.tsx (AI chat for individual files)
│   ├── AudioPlayer.tsx (audio playback page)
│   ├── SettingsPage.tsx (settings page)
│   └── ... (other components)
```

## Technical Details

### State Management

- **App.tsx**: Global state (accessibility, current screen, lessons)
- **UploadPage**: Local state (selectedWorkspace)
- **PastLessons**: Stateless - receives data via props
- **Workspace**: Local state (chat messages, input)

### Navigation Pattern

```typescript
// App.tsx controls screen navigation
type Screen = "dashboard" | "upload" | "processing" | "player" | "settings" | "lessons";

// Each page component receives:
- onBack: () => void  // Navigate back to dashboard
- Data props          // Any data needed for display
- Action handlers     // Functions to perform actions
```

## Future Enhancements

### Potential Additions

- [ ] Add URL routing (React Router) for shareable links
- [ ] Add breadcrumb navigation
- [ ] Save workspace session state
- [ ] Add keyboard shortcuts for navigation
- [ ] Implement nested routing for sub-pages
- [ ] Add page transitions/animations

### Component Split Ideas

- [ ] Create UploadTab component for individual tabs
- [ ] Extract upload area into reusable component
- [ ] Create FileCard component for upload lists
- [ ] Add NavigationLayout wrapper component

## Testing Considerations

### Component Testing

Each page can now be tested independently:

```typescript
// Example: Testing UploadPage
describe("UploadPage", () => {
  it("should display three tabs", () => {
    render(<UploadPage {...mockProps} />);
    expect(screen.getByText("📄 Notes")).toBeInTheDocument();
    expect(screen.getByText("🎤 Recordings")).toBeInTheDocument();
    expect(screen.getByText("∑ Math")).toBeInTheDocument();
  });

  it("should call onBack when back button clicked", () => {
    const onBack = jest.fn();
    render(<UploadPage {...mockProps} onBack={onBack} />);
    fireEvent.click(screen.getByText("← Back to Dashboard"));
    expect(onBack).toHaveBeenCalled();
  });
});
```

## Migration Guide

If you need to add similar page-level components:

1. **Create new page component**: `components/YourPage.tsx`
2. **Define props interface** with navigation callbacks
3. **Import in App.tsx**
4. **Add screen type** to `Screen` union
5. **Add conditional render** in App.tsx main section
6. **Update Dashboard** or navigation to include new page
7. **Test navigation flow**

## Summary

The refactor successfully separates upload and lessons functionality into dedicated page components, making the codebase more maintainable and the user experience more focused. Each page now has clear responsibilities and can be developed/tested independently.
