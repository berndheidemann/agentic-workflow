import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/use-auth';
import { COLLECTION_PROGRESS } from '../schema/collections';
import type { Progress } from '../schema/collections';
import { SyncEngine } from './sync-engine';
import { parseUrlToCoursePath } from './url-parser';
import type { ExerciseCompleteDetail, UseProgressReturn } from './types';

// ─── No-op return value for guest users ──────────────────────────────────────

const GUEST_RETURN: UseProgressReturn = {
  reportComplete: () => undefined,
  getProgress: () => Promise.resolve([]),
  pendingCount: 0,
  isSyncing: false,
};

// ─── useProgress ──────────────────────────────────────────────────────────────

/**
 * Hook for progress tracking in learning sites.
 *
 * Must be used inside `<AuthProvider>`.
 *
 * - When not logged in: all operations are no-ops (guest mode — no error, no tracking).
 * - Listens to 'exercise-complete' CustomEvents fired by the learning sites.
 * - Syncs queued entries to PocketBase every 30s or when the page is hidden.
 * - Derives course and lesson from `window.location.pathname`.
 */
export function useProgress(): UseProgressReturn {
  const { isLoggedIn, user, pb, isLoading } = useAuth();

  const engineRef = useRef<SyncEngine | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Create and manage the SyncEngine lifecycle
  useEffect(() => {
    if (!isLoggedIn || !user || isLoading) return;

    const engine = new SyncEngine({ pb, userId: user.id });
    engineRef.current = engine;

    const unsubscribe = engine.onChange(() => {
      setPendingCount(engine.pendingCount);
      setIsSyncing(engine.isSyncing);
    });

    engine.start();

    return () => {
      unsubscribe();
      void engine.stop();
      engineRef.current = null;
    };
  }, [isLoggedIn, user, pb, isLoading]);

  // Listen to 'exercise-complete' CustomEvents from the learning sites
  useEffect(() => {
    if (!isLoggedIn || !user || isLoading) return;

    function handleExerciseComplete(event: Event): void {
      const detail = (event as CustomEvent<ExerciseCompleteDetail>).detail;
      if (!detail?.exerciseId) return;

      const parsed = parseUrlToCoursePath();
      if (!parsed) return;

      engineRef.current?.enqueue({
        course: parsed.course,
        lesson: parsed.lesson,
        exercise: detail.exerciseId,
        score: detail.score ?? 0,
        maxScore: detail.maxScore ?? 1,
        completedAt: new Date().toISOString(),
      });
    }

    window.addEventListener('exercise-complete', handleExerciseComplete);
    return () => {
      window.removeEventListener('exercise-complete', handleExerciseComplete);
    };
  }, [isLoggedIn, user, isLoading]);

  const reportComplete = useCallback(
    (exerciseId: string, score: number, maxScore: number): void => {
      if (!isLoggedIn || !user || isLoading) return;

      const parsed = parseUrlToCoursePath();
      if (!parsed) return;

      engineRef.current?.enqueue({
        course: parsed.course,
        lesson: parsed.lesson,
        exercise: exerciseId,
        score,
        maxScore,
        completedAt: new Date().toISOString(),
      });
    },
    [isLoggedIn, user, isLoading]
  );

  const getProgress = useCallback(
    async (course: string): Promise<Progress[]> => {
      if (!isLoggedIn || !user || isLoading) return [];

      return pb.collection(COLLECTION_PROGRESS).getFullList<Progress>({
        filter: `user_id = "${user.id}" && course = "${course}"`,
        sort: 'lesson,exercise',
      });
    },
    [isLoggedIn, user, pb, isLoading]
  );

  // Guest mode: return stable no-ops without any state
  if (!isLoggedIn || !user) {
    return GUEST_RETURN;
  }

  return {
    reportComplete,
    getProgress,
    pendingCount,
    isSyncing,
  };
}
