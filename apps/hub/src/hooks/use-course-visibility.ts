import { useState, useEffect } from 'react';
import { useAuth } from '@lernplattform/shared';
import type { CourseUnlock } from '@lernplattform/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseCourseVisibilityReturn {
  /**
   * Set of course slugs visible to the current user.
   * null means "all courses visible" (guest, teacher, student without class,
   * or student whose class has no unlock records yet — default-open).
   */
  visibleCourses: Set<string> | null;
  /** Whether visibility data is still loading */
  isLoading: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Determines which courses are visible to the current user based on
 * their class's course_unlocks records.
 *
 * Rules:
 * - Guest (not logged in): null → all visible
 * - Teacher: null → all visible
 * - Student without classId: null → all visible
 * - Student with classId, no unlock records exist: null → all visible (default-open)
 * - Student with classId, records exist: Set of courses that have at least one record
 * - On API error: null → graceful degradation (all visible)
 */
export function useCourseVisibility(): UseCourseVisibilityReturn {
  const { pb, user, isLoggedIn } = useAuth();
  const [visibleCourses, setVisibleCourses] = useState<Set<string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Not a logged-in student with a class → all visible
    if (!isLoggedIn || !user || user.role !== 'student' || !user.classId) {
      setVisibleCourses(null);
      setIsLoading(false);
      return;
    }

    const classId = user.classId;
    let stale = false;

    async function load() {
      setIsLoading(true);
      try {
        const records = await pb.collection('course_unlocks').getFullList<CourseUnlock>({
          filter: `class_id = "${classId}" && user_id = ""`,
          fields: 'course',
        });

        if (stale) return;

        if (records.length === 0) {
          // No records for this class → default-open (all visible)
          setVisibleCourses(null);
        } else {
          // Records exist → only show courses that have at least one record
          const courses = new Set(records.map((r) => r.course));
          setVisibleCourses(courses);
        }
      } catch {
        if (!stale) {
          // On error: graceful degradation → all visible
          setVisibleCourses(null);
        }
      } finally {
        if (!stale) setIsLoading(false);
      }
    }

    load();
    return () => {
      stale = true;
    };
  }, [pb, isLoggedIn, user?.role, user?.classId]);

  return { visibleCourses, isLoading };
}
