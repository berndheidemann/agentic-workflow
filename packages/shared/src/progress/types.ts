import type { Progress } from '../schema/collections';

// ─── Progress entry ────────────────────────────────────────────────────────────

/** A single progress record ready to be synced to PocketBase. */
export interface ProgressEntry {
  course: string;
  lesson: string;
  exercise: string;
  score: number;
  maxScore: number;
  completedAt: string; // ISO 8601
}

// ─── CustomEvent ───────────────────────────────────────────────────────────────

/** Payload of the 'exercise-complete' CustomEvent fired by learning sites. */
export interface ExerciseCompleteDetail {
  exerciseId: string;
  score: number;
  maxScore: number;
}

// ─── Hook return type ─────────────────────────────────────────────────────────

/** Return type of useProgress(). */
export interface UseProgressReturn {
  /** Manually report an exercise as completed. URL is used to derive course/lesson. */
  reportComplete: (exerciseId: string, score: number, maxScore: number) => void;
  /** Fetch all progress records for a given course (only when logged in). */
  getProgress: (course: string) => Promise<Progress[]>;
  /** Number of entries not yet synced to the server. */
  pendingCount: number;
  /** Whether a sync is currently in progress. */
  isSyncing: boolean;
}

// ─── Re-export for convenience ────────────────────────────────────────────────

export type { Progress };
