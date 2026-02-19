/**
 * TypeScript types for PocketBase collections.
 *
 * These must stay in sync with the migration:
 *   pb_migrations/1708300000_create_collections.js
 *
 * PocketBase adds `id`, `created`, `updated` automatically to every record.
 */

// ─── Collection name constants ────────────────────────────────────────────────

export const COLLECTION_USERS = 'users' as const;
export const COLLECTION_CLASSES = 'classes' as const;
export const COLLECTION_COURSE_UNLOCKS = 'course_unlocks' as const;
export const COLLECTION_PROGRESS = 'progress' as const;

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'teacher';
export type ProgressStatus = 'started' | 'completed';

// ─── Collection interfaces ────────────────────────────────────────────────────

/**
 * Auth collection `users`.
 * PocketBase fields: id, email, emailVisibility, verified, username, created, updated
 * Custom fields: role, class_id, display_name
 */
export interface User {
  id: string;
  username: string;
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  role: UserRole;
  class_id: string | null;
  display_name: string;
  created: string;
  updated: string;
}

/**
 * Base collection `classes`.
 */
export interface Class {
  id: string;
  name: string;
  join_code: string;
  school_year: string;
  is_active: boolean;
  created_by: string;
  created: string;
  updated: string;
}

/**
 * Base collection `course_unlocks`.
 * `user_id` is nullable — null means the unlock applies to the whole class.
 */
export interface CourseUnlock {
  id: string;
  class_id: string;
  user_id: string | null;
  course: string;
  module: string;
  is_unlocked: boolean;
  unlocked_by: string;
  unlocked_at: string;
  created: string;
  updated: string;
}

/**
 * Base collection `progress`.
 * UNIQUE constraint on (user_id, course, lesson, exercise).
 * `suspicious` is set server-side by PocketBase hooks (REQ-008).
 */
export interface Progress {
  id: string;
  user_id: string;
  course: string;
  lesson: string;
  exercise: string;
  status: ProgressStatus;
  score: number;
  max_score: number;
  attempts: number;
  completed_at: string | null;
  suspicious: boolean;
  created: string;
  updated: string;
}
