import { useState, useEffect } from 'react';
import { useAuth } from '@lernplattform/shared';
import type { User, Class } from '@lernplattform/shared';
import { useSites } from '../config/sites';
import { useStudentProgress } from '../hooks/use-student-progress';
import { ProgressBar } from './progress-bar';
import { ResetPinDialog } from './reset-pin-dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentDetailProps {
  studentId: string;
  classId: string;
  onBack: () => void;
}

interface LoadState {
  student: User | null;
  classData: Class | null;
  isLoading: boolean;
  error: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Detailed view for a single student: username, class, progress overview, and PIN reset.
 * Only accessible by teachers (wrapped in ProtectedRoute at router level).
 */
export function StudentDetail({ studentId, classId, onBack }: StudentDetailProps) {
  const { pb } = useAuth();
  const { sites } = useSites();

  const [loadState, setLoadState] = useState<LoadState>({
    student: null,
    classData: null,
    isLoading: true,
    error: null,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const { courses, totalCompleted, totalExercises, totalPercentage, isLoading: progressLoading } =
    useStudentProgress(studentId, sites);

  useEffect(() => {
    let stale = false;

    async function loadData() {
      try {
        const [student, classData] = await Promise.all([
          pb.collection('users').getOne<User>(studentId),
          pb.collection('classes').getOne<Class>(classId),
        ]);
        if (!stale) {
          setLoadState({ student, classData, isLoading: false, error: null });
        }
      } catch {
        if (!stale) {
          setLoadState({ student: null, classData: null, isLoading: false, error: 'Schülerdaten konnten nicht geladen werden.' });
        }
      }
    }

    loadData();
    return () => {
      stale = true;
    };
  }, [studentId, classId, pb]);

  async function handlePinReset(newPin: string) {
    await pb.collection('users').update(studentId, { password: newPin, passwordConfirm: newPin });
  }

  const isLoading = loadState.isLoading || progressLoading;

  return (
    <section aria-labelledby="student-detail-heading">
      {/* Back button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Zurück zur Klassen-Übersicht"
        >
          ← Zurück
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div role="status" aria-live="polite" aria-busy="true" className="py-8 text-center text-gray-500 text-sm">
          <span>Daten werden geladen…</span>
        </div>
      )}

      {/* Error state */}
      {loadState.error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {loadState.error}
        </div>
      )}

      {/* Content */}
      {!loadState.isLoading && !loadState.error && loadState.student && (
        <>
          {/* Student info header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 id="student-detail-heading" className="text-xl font-semibold text-gray-800">
                {loadState.student.username}
              </h2>
              {loadState.student.display_name && (
                <p className="text-gray-500 text-sm mt-0.5">{loadState.student.display_name}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Klasse:{' '}
                <span className="font-medium text-gray-700">
                  {loadState.classData?.name ?? '—'}
                  {loadState.classData?.school_year ? ` (${loadState.classData.school_year})` : ''}
                </span>
              </p>
            </div>

            {/* PIN Reset button */}
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="self-start px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors whitespace-nowrap"
              aria-label={`PIN zurücksetzen für ${loadState.student.username}`}
            >
              PIN zurücksetzen
            </button>
          </div>

          {/* Overall progress summary */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm font-medium text-blue-700 mb-1">Gesamtfortschritt</p>
            <p className="text-2xl font-bold text-blue-900">
              {totalPercentage}%
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              {totalCompleted} von {totalExercises} Aufgaben abgeschlossen
            </p>
          </div>

          {/* Per-course progress */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Fortschritt nach Kurs</h3>

            {progressLoading ? (
              <div role="status" aria-live="polite" aria-busy="true" className="py-4 text-gray-500 text-sm">
                Fortschrittsdaten werden geladen…
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div
                    key={course.courseSlug}
                    className="bg-white border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium text-gray-700">{course.courseName}</span>
                      <span className="text-sm font-semibold text-gray-900">{course.percentage}%</span>
                    </div>
                    <ProgressBar
                      percentage={course.percentage}
                      completedCount={course.completedExercises}
                      totalCount={course.totalExercises}
                      courseSlug={course.courseSlug}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* PIN Reset Dialog */}
      {loadState.student && (
        <ResetPinDialog
          studentName={loadState.student.username}
          isOpen={dialogOpen}
          onConfirm={handlePinReset}
          onCancel={() => setDialogOpen(false)}
        />
      )}
    </section>
  );
}
