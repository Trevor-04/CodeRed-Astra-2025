import { useState, useEffect } from "react";
import { UploadService, type Upload } from "../services/uploadService";
import { Pagination } from "./Pagination";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface RecentRecordingsProps {
  onSelectRecording: (recording: Upload) => void;
  userId?: string;
}

export function RecentRecordings({ onSelectRecording, userId = '123e4567-e89b-12d3-a456-426614174000' }: RecentRecordingsProps) {
  const [recordings, setRecordings] = useState<Upload[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 5;

  const fetchRecordings = async (page: number = 1) => {
    try {
      console.log('🔄 Recent Recordings: Starting fetch for page', page, 'userId:', userId);
      setLoading(true);
      setError(null);

      // Fetch recent recordings (video and audio only)
      const data = await UploadService.getRecentRecordings(userId, page, itemsPerPage);
      console.log('✅ Recent Recordings: Fetched data:', data);

      setRecordings(data.uploads);
      setPagination(data.pagination);
    } catch (err) {
      console.error('❌ Recent Recordings: Error fetching:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recordings');
      // Fallback to empty state
      setRecordings([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrevious: false,
      });
    } finally {
      setLoading(false);
      console.log('🏁 Recent Recordings: Fetch completed, loading set to false');
    }
  };

  useEffect(() => {
    console.log('🚀 Recent Recordings: useEffect triggered with currentPage:', currentPage, 'userId:', userId);
    fetchRecordings(currentPage);
  }, [currentPage, userId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRecordingClick = (recording: Upload) => {
    onSelectRecording(recording);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading recordings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎤</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No recordings found
        </h3>
        <p className="text-gray-600">
          Upload your first audio or video recording to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            onClick={() => handleRecordingClick(recording)}
            className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {recording.type === "video" ? "🎥" : "🔊"}
              </span>
              <div>
                <p className="font-semibold text-gray-900">
                  {recording.original_name}
                </p>
                <p className="text-sm text-gray-600">
                  Uploaded{" "}
                  {new Date(recording.created_at).toLocaleString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {recording.parsed_text ? 'Transcribed' : 'Processing'}
            </span>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          hasNext={pagination.hasNext}
          hasPrevious={pagination.hasPrevious}
          totalCount={pagination.totalCount}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}