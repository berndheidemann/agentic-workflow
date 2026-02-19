import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/use-auth';
import { COLLECTION_COURSE_UNLOCKS } from '../schema/collections';
import type { CourseUnlock } from '../schema/collections';
import type { UnlockCache, UseUnlockReturn } from './types';

// ─── No-op return value for guest users (all open) ───────────────────────────

const GUEST_RETURN: UseUnlockReturn = {
  isModuleUnlocked: () => true,
  getUnlockedModules: () => null,
  isLoading: false,
};

// ─── useUnlock ────────────────────────────────────────────────────────────────

/**
 * Hook for checking which modules are unlocked for the current user's class.
 *
 * Must be used inside `<AuthProvider>`.
 *
 * - Guest mode (not logged in): all modules open, no API calls.
 * - No class assigned: all modules open, no API calls.
 * - Lazy-loads unlock data per course on first access.
 * - Caches results in memory (invalidated on class change).
 * - Default-open: if no unlock rules exist for a course, all modules are open.
 */
export function useUnlock(): UseUnlockReturn {
  const { isLoggedIn, user, pb, isLoading: authLoading } = useAuth();

  // In-memory cache: course → CourseUnlock[]
  const cacheRef = useRef<UnlockCache>(new Map());
  // Track which courses have already been fetched (avoid duplicate API calls)
  const fetchedCoursesRef = useRef<Set<string>>(new Set());
  // Track ongoing fetches (avoid parallel duplicate fetches)
  const fetchingCoursesRef = useRef<Set<string>>(new Set());
  // Version counter to trigger re-renders when cache updates
  const [, setVersion] = useState(0);
  const [isLoadingUnlock, setIsLoadingUnlock] = useState(false);

  // Invalidate cache when class changes (or on logout)
  useEffect(() => {
    cacheRef.current = new Map();
    fetchedCoursesRef.current = new Set();
    fetchingCoursesRef.current = new Set();
    setVersion(0);
    setIsLoadingUnlock(false);
  }, [user?.classId]);

  const fetchCourse = useCallback(
    async (course: string): Promise<void> => {
      if (!isLoggedIn || !user || !user.classId || authLoading) return;
      if (fetchedCoursesRef.current.has(course)) return;
      if (fetchingCoursesRef.current.has(course)) return;

      fetchingCoursesRef.current.add(course);
      setIsLoadingUnlock(true);

      try {
        const records = await pb
          .collection(COLLECTION_COURSE_UNLOCKS)
          .getFullList<CourseUnlock>({
            filter: `class_id = "${user.classId}" && course = "${course}"`,
          });

        cacheRef.current.set(course, records);
        fetchedCoursesRef.current.add(course);
        setVersion((v) => v + 1);
      } catch {
        // On error, mark as fetched with empty array (default-open)
        cacheRef.current.set(course, []);
        fetchedCoursesRef.current.add(course);
        setVersion((v) => v + 1);
      } finally {
        fetchingCoursesRef.current.delete(course);
        if (fetchingCoursesRef.current.size === 0) {
          setIsLoadingUnlock(false);
        }
      }
    },
    [isLoggedIn, user, pb, authLoading],
  );

  const isModuleUnlocked = useCallback(
    (course: string, module: string): boolean => {
      // Guest mode or no class: all open
      if (!isLoggedIn || !user || !user.classId) return true;
      // Still loading auth: optimistically open
      if (authLoading) return true;

      const cached = cacheRef.current.get(course);

      if (cached === undefined) {
        // Not yet fetched — trigger lazy load (fire-and-forget)
        void fetchCourse(course);
        // Optimistically open while loading
        return true;
      }

      // No unlock rules for this course/class → default-open
      if (cached.length === 0) return true;

      // Rules exist: check if this module is explicitly unlocked
      return cached.some((entry) => entry.module === module && entry.is_unlocked);
    },
    [isLoggedIn, user, authLoading, fetchCourse],
  );

  const getUnlockedModules = useCallback(
    (course: string): string[] | null => {
      // Guest mode or no class: null = all open
      if (!isLoggedIn || !user || !user.classId) return null;
      // Still loading auth: null = unknown
      if (authLoading) return null;

      const cached = cacheRef.current.get(course);

      if (cached === undefined) {
        // Not yet fetched — trigger lazy load (fire-and-forget)
        void fetchCourse(course);
        return null;
      }

      // No unlock rules → null (all open)
      if (cached.length === 0) return null;

      // Return names of explicitly unlocked modules
      return cached.filter((entry) => entry.is_unlocked).map((entry) => entry.module);
    },
    [isLoggedIn, user, authLoading, fetchCourse],
  );

  // Guest mode: stable reference, no re-renders
  if (!isLoggedIn || !user) {
    return GUEST_RETURN;
  }

  return {
    isModuleUnlocked,
    getUnlockedModules,
    isLoading: authLoading || isLoadingUnlock,
  };
}
