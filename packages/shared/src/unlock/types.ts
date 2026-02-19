import type { CourseUnlock } from '../schema/collections';

// ─── Module status ─────────────────────────────────────────────────────────────

/**
 * Three-state status for a module in the sidebar.
 * - locked: module exists but is not yet unlocked by the teacher
 * - unlocked: module is accessible (default state for guests / no rules)
 * - completed: module is accessible and the user has finished all exercises
 */
export type ModuleStatus = 'locked' | 'unlocked' | 'completed';

// ─── Hook return type ─────────────────────────────────────────────────────────

/** Return type of useUnlock(). */
export interface UseUnlockReturn {
  /**
   * Check if a specific module is unlocked for the current user's class.
   *
   * - Guest mode / no class: always returns true (all open).
   * - No unlock rules exist for this course: returns true (default-open).
   * - Unlock rules exist: returns true only if the module has an is_unlocked=true entry.
   * - While loading: returns true (optimistic open while fetching).
   */
  isModuleUnlocked: (course: string, module: string) => boolean;
  /**
   * Get all unlocked module names for a course.
   *
   * Returns null if no unlock rules exist (= all open / not yet loaded).
   * Returns string[] with module names that have is_unlocked=true.
   */
  getUnlockedModules: (course: string) => string[] | null;
  /** Whether unlock data is currently being loaded from PocketBase. */
  isLoading: boolean;
}

// ─── Internal cache ───────────────────────────────────────────────────────────

/**
 * Internal cache state for a single course.
 * Key = course name.
 * Value = array of CourseUnlock records for the user's class.
 */
export type UnlockCache = Map<string, CourseUnlock[]>;

// ─── Re-export for convenience ────────────────────────────────────────────────

export type { CourseUnlock };
