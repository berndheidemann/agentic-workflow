import { useState, useEffect } from 'react';
import { useAuth } from '@lernplattform/shared';
import type { SiteConfig } from '../config/sites';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentCourseProgress {
  courseSlug: string;
  courseName: string;
  completedExercises: number;
  totalExercises: number;
  percentage: number;
}

export interface UseStudentProgressReturn {
  courses: StudentCourseProgress[];
  totalCompleted: number;
  totalExercises: number;
  totalPercentage: number;
  isLoading: boolean;
  error: string | null;
}

interface ProgressRecord {
  course: string;
  lesson: string;
}

/**
 * Fetches progress data for a single student across all courses.
 * Requires teacher-level auth (teacher can read any student's progress).
 *
 * Returns per-course progress items and aggregate totals.
 * studentId = null → returns empty result, no API call.
 */
export function useStudentProgress(
  studentId: string | null,
  sites: SiteConfig[]
): UseStudentProgressReturn {
  const { pb } = useAuth();
  const [courses, setCourses] = useState<StudentCourseProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable key to avoid infinite loops from array identity changes
  const siteSlugsKey = sites.map((s) => s.slug).join(',');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!studentId) {
        setCourses([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const records = await pb.collection('progress').getFullList<ProgressRecord>({
          filter: `user_id = "${studentId}" && status = "completed"`,
          fields: 'course,lesson',
        });

        if (cancelled) return;

        // Group completed exercises by course
        const completedByCourse = new Map<string, number>();
        for (const record of records) {
          completedByCourse.set(
            record.course,
            (completedByCourse.get(record.course) ?? 0) + 1
          );
        }

        // Build per-course progress list (only active sites)
        const result: StudentCourseProgress[] = sites.map((site) => {
          const completed = completedByCourse.get(site.slug) ?? 0;
          const total = site.totalExercises;
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
          return {
            courseSlug: site.slug,
            courseName: site.name,
            completedExercises: completed,
            totalExercises: total,
            percentage,
          };
        });

        setCourses(result);
        setIsLoading(false);
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
        setError(`Fortschrittsdaten konnten nicht geladen werden: ${message}`);
        setCourses([]);
        setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, pb, siteSlugsKey]);

  const totalCompleted = courses.reduce((sum, c) => sum + c.completedExercises, 0);
  const totalExercises = courses.reduce((sum, c) => sum + c.totalExercises, 0);
  const totalPercentage = totalExercises > 0 ? Math.round((totalCompleted / totalExercises) * 100) : 0;

  return { courses, totalCompleted, totalExercises, totalPercentage, isLoading, error };
}
