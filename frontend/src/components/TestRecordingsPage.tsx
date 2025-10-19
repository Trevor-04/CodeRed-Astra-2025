import { useState } from "react";
import { RecentRecordings } from "./RecentRecordings";
import { UploadService, type Upload } from "../services/uploadService";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

export function TestRecordingsPage() {
  const [selectedRecording, setSelectedRecording] = useState<Upload | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('Unknown');

  // Test API connection
  const testApiConnection = async () => {
    setApiStatus('Testing...');
    const result = await UploadService.testConnection();
    setApiStatus(result.details || (result.success ? '✅ Connected' : `❌ Failed: ${result.error}`));
  };

  // Create some test data (you can run this once to populate the database)
  const createTestData = async () => {
    const testUploads = [
      {
        id: 'test-1',
        userId: 'user-123',
        type: 'video',
        filePath: '/storage/lecture1.mp4',
        originalName: 'Math_Lecture_1.mp4',
        parsedText: 'Today we will discuss calculus and derivatives...',
      },
      {
        id: 'test-2',
        userId: 'user-123',
        type: 'audio',
        filePath: '/storage/discussion.mp3',
        originalName: 'Study_Group_Discussion.mp3',
        parsedText: 'Let\'s review the key concepts from chapter 5...',
      },
      {
        id: 'test-3',
        userId: 'user-123',
        type: 'video',
        filePath: '/storage/chemistry.mp4',
        originalName: 'Chemistry_Lab_Demo.mp4',
        parsedText: 'In this experiment, we will observe the reaction between...',
      },
      {
        id: 'test-4',
        userId: 'user-123',
        type: 'audio',
        filePath: '/storage/notes.mp3',
        originalName: 'Personal_Study_Notes.mp3',
        parsedText: 'Remember to focus on the integration by parts formula...',
      },
      {
        id: 'test-5',
        userId: 'user-123',
        type: 'video',
        filePath: '/storage/physics.mp4',
        originalName: 'Physics_Problem_Solving.mp4',
        parsedText: 'When solving kinematics problems, always start with...',
      },
      {
        id: 'test-6',
        userId: 'user-123',
        type: 'audio',
        filePath: '/storage/review.mp3',
        originalName: 'Exam_Review_Session.mp3',
        parsedText: 'The most important topics for the midterm include...',
      },
    ];

    try {
      for (const upload of testUploads) {
        await UploadService.saveUpload(upload);
      }
      console.log('Test data created successfully');
    } catch (error) {
      console.error('Error creating test data:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Test Recent Recordings
        </h1>
        <p className="text-gray-600">
          Testing the pagination and database integration for recordings.
        </p>
        <div className="flex gap-4 mt-4">
          <Button
            onClick={testApiConnection}
            variant="outline"
            className="cursor-pointer"
          >
            Test API Connection
          </Button>
          <Button onClick={createTestData} className="cursor-pointer">
            Create Test Data
          </Button>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          API Status: <span className="font-mono">{apiStatus}</span>
        </div>
      </div>

      {!selectedRecording ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Recordings</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentRecordings
              onSelectRecording={setSelectedRecording}
              userId="user-123"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Selected Recording</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedRecording(null)}
              >
                ← Back to Recordings
              </Button>
              
              <div>
                <h3 className="font-semibold text-lg">{selectedRecording.original_name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Type: {selectedRecording.type} | 
                  Uploaded: {new Date(selectedRecording.created_at).toLocaleString()}
                </p>
                {selectedRecording.parsed_text && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Transcription:</h4>
                    <p className="text-gray-800">{selectedRecording.parsed_text}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}