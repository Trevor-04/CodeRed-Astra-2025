import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Play, Trash2, Clock } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  date: string;
  audioUrl: string;
  extractedText: string;
  mathContent: string;
}

interface PastLessonsProps {
  lessons: Lesson[];
  onPlayLesson: (lesson: Lesson) => void;
  onDeleteLesson: (id: string) => void;
  onBack: () => void;
}

export function PastLessons({ lessons, onPlayLesson, onDeleteLesson, onBack }: PastLessonsProps) {
  return (
    <main className="container mx-auto px-6 lg:px-12 py-6 lg:py-12 max-w-[1200px]" role="main">
      <Button
        onClick={onBack}
        className="cursor-pointer mb-8 min-h-[48px] px-6 bg-white text-[#1D4ED8] border-2 border-[#1D4ED8] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200"
        aria-label="Go back to dashboard"
      >
        ← Back to Dashboard
      </Button>

      <h2 className="text-3xl lg:text-4xl mb-8 lg:mb-12 text-[#0F172A]">Past Lessons</h2>

      {lessons.length === 0 ? (
        <Card className="bg-[#F8FAFC] border-[#E2E8F0] shadow-md rounded-lg">
          <CardContent className="p-16 lg:p-20 text-center">
            <p className="text-xl lg:text-2xl text-[#64748B]">
              No lessons yet. Upload your first STEM content to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 lg:space-y-8" role="list" aria-label="Past lessons">
          {lessons.map((lesson) => (
            <Card 
              key={lesson.id} 
              className="bg-white border-[#E2E8F0] shadow-md hover:border-[#3B82F6] hover:shadow-lg transition-all duration-200 rounded-lg"
              role="listitem"
            >
              <CardHeader className="p-6 lg:p-8">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xl lg:text-2xl text-[#0F172A]">
                  <span className="break-words">{lesson.title}</span>
                  <span className="flex items-center gap-2 text-base text-[#64748B] flex-shrink-0">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    {lesson.date}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 lg:p-8 pt-0">
                <p className="text-[#64748B] text-base lg:text-lg mb-6 line-clamp-2">
                  {lesson.extractedText}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Primary button for main action */}
                  <Button
                    onClick={() => onPlayLesson(lesson)}
                    className="cursor-pointer gap-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white min-h-[48px] px-6 rounded-lg transition-all duration-200"
                    aria-label={`Play lesson: ${lesson.title}`}
                  >
                    <Play className="w-5 h-5" aria-hidden="true" />
                    Play Lesson
                  </Button>
                  {/* Error color for delete action */}
                  <Button
                    onClick={() => onDeleteLesson(lesson.id)}
                    className="cursor-pointer gap-2 border-2 border-[#DC2626] text-[#DC2626] hover:bg-[#FEE2E2] bg-white min-h-[48px] px-6 rounded-lg transition-all duration-200"
                    aria-label={`Delete lesson: ${lesson.title}`}
                  >
                    <Trash2 className="w-5 h-5" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}