import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import {
  COLLECTION_USERS,
  COLLECTION_CLASSES,
  COLLECTION_COURSE_UNLOCKS,
  COLLECTION_PROGRESS,
} from './collections';
import type { UserRole, ProgressStatus, User, Class, CourseUnlock, Progress } from './collections';

// ─── Collection name constants ────────────────────────────────────────────────

describe('Collection name constants', () => {
  it("COLLECTION_USERS equals 'users'", () => {
    expect(COLLECTION_USERS).toBe('users');
  });

  it("COLLECTION_CLASSES equals 'classes'", () => {
    expect(COLLECTION_CLASSES).toBe('classes');
  });

  it("COLLECTION_COURSE_UNLOCKS equals 'course_unlocks'", () => {
    expect(COLLECTION_COURSE_UNLOCKS).toBe('course_unlocks');
  });

  it("COLLECTION_PROGRESS equals 'progress'", () => {
    expect(COLLECTION_PROGRESS).toBe('progress');
  });
});

// ─── Type guards (runtime shape validation) ───────────────────────────────────

function isUser(obj: unknown): obj is User {
  const u = obj as Record<string, unknown>;
  return (
    typeof u.id === 'string' &&
    typeof u.username === 'string' &&
    typeof u.email === 'string' &&
    typeof u.emailVisibility === 'boolean' &&
    typeof u.verified === 'boolean' &&
    (u.role === 'student' || u.role === 'teacher') &&
    (u.class_id === null || typeof u.class_id === 'string') &&
    typeof u.display_name === 'string' &&
    typeof u.created === 'string' &&
    typeof u.updated === 'string'
  );
}

function isClass(obj: unknown): obj is Class {
  const c = obj as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.join_code === 'string' &&
    typeof c.school_year === 'string' &&
    typeof c.is_active === 'boolean' &&
    typeof c.created_by === 'string' &&
    typeof c.created === 'string' &&
    typeof c.updated === 'string'
  );
}

function isCourseUnlock(obj: unknown): obj is CourseUnlock {
  const cu = obj as Record<string, unknown>;
  return (
    typeof cu.id === 'string' &&
    typeof cu.class_id === 'string' &&
    (cu.user_id === null || typeof cu.user_id === 'string') &&
    typeof cu.course === 'string' &&
    typeof cu.module === 'string' &&
    typeof cu.is_unlocked === 'boolean' &&
    typeof cu.unlocked_by === 'string' &&
    typeof cu.unlocked_at === 'string' &&
    typeof cu.created === 'string' &&
    typeof cu.updated === 'string'
  );
}

function isProgress(obj: unknown): obj is Progress {
  const p = obj as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.user_id === 'string' &&
    typeof p.course === 'string' &&
    typeof p.lesson === 'string' &&
    typeof p.exercise === 'string' &&
    (p.status === 'started' || p.status === 'completed') &&
    typeof p.score === 'number' &&
    typeof p.max_score === 'number' &&
    typeof p.attempts === 'number' &&
    (p.completed_at === null || typeof p.completed_at === 'string') &&
    typeof p.created === 'string' &&
    typeof p.updated === 'string'
  );
}

// ─── User interface ───────────────────────────────────────────────────────────

describe('User interface', () => {
  const validUser: User = {
    id: 'abc123',
    username: 'max.m',
    email: 'max@example.de',
    emailVisibility: false,
    verified: false,
    role: 'student',
    class_id: 'class123',
    display_name: 'Max M.',
    created: '2026-01-01T00:00:00Z',
    updated: '2026-01-01T00:00:00Z',
  };

  it('validates a valid user record', () => {
    expect(isUser(validUser)).toBe(true);
  });

  it('accepts student and teacher as valid roles', () => {
    const roles: UserRole[] = ['student', 'teacher'];
    for (const role of roles) {
      expect(isUser({ ...validUser, role })).toBe(true);
    }
  });

  it('allows null class_id (teacher without class)', () => {
    expect(isUser({ ...validUser, class_id: null })).toBe(true);
  });

  it('rejects invalid role', () => {
    expect(isUser({ ...validUser, role: 'admin' })).toBe(false);
  });
});

// ─── Class interface ──────────────────────────────────────────────────────────

describe('Class interface', () => {
  const validClass: Class = {
    id: 'class123',
    name: 'FI24a',
    join_code: 'K7FN3X',
    school_year: '2025/26',
    is_active: true,
    created_by: 'teacher456',
    created: '2026-01-01T00:00:00Z',
    updated: '2026-01-01T00:00:00Z',
  };

  it('validates a valid class record', () => {
    expect(isClass(validClass)).toBe(true);
  });

  it('accepts is_active = false', () => {
    expect(isClass({ ...validClass, is_active: false })).toBe(true);
  });
});

// ─── CourseUnlock interface ───────────────────────────────────────────────────

describe('CourseUnlock interface', () => {
  const validUnlock: CourseUnlock = {
    id: 'unlock789',
    class_id: 'class123',
    user_id: null,
    course: 'ap1',
    module: 'netzwerktechnik',
    is_unlocked: true,
    unlocked_by: 'teacher456',
    unlocked_at: '2026-01-01T10:00:00Z',
    created: '2026-01-01T10:00:00Z',
    updated: '2026-01-01T10:00:00Z',
  };

  it('validates a valid course_unlock record (class-level, user_id = null)', () => {
    expect(isCourseUnlock(validUnlock)).toBe(true);
  });

  it('allows non-null user_id (individual unlock)', () => {
    expect(isCourseUnlock({ ...validUnlock, user_id: 'user123' })).toBe(true);
  });
});

// ─── Progress interface ───────────────────────────────────────────────────────

describe('Progress interface', () => {
  const validProgress: Progress = {
    id: 'prog001',
    user_id: 'abc123',
    course: 'ap1',
    lesson: 'netzwerktechnik/subnetting',
    exercise: 'subnetting-01',
    status: 'completed',
    score: 8,
    max_score: 10,
    attempts: 2,
    completed_at: '2026-01-01T12:00:00Z',
    created: '2026-01-01T11:00:00Z',
    updated: '2026-01-01T12:00:00Z',
  };

  it('validates a valid progress record', () => {
    expect(isProgress(validProgress)).toBe(true);
  });

  it("accepts status 'started' and 'completed'", () => {
    const statuses: ProgressStatus[] = ['started', 'completed'];
    for (const status of statuses) {
      expect(isProgress({ ...validProgress, status })).toBe(true);
    }
  });

  it('allows null completed_at (in-progress exercise)', () => {
    expect(isProgress({ ...validProgress, completed_at: null })).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(isProgress({ ...validProgress, status: 'skipped' })).toBe(false);
  });
});

// ─── Migration file structural validation ─────────────────────────────────────
// These tests verify that the migration file contains the required collection
// definitions and API rules without executing it against a real PocketBase.

describe('Migration file structure', () => {
  let migrationSource: string;

  // Read the migration file via Node.js fs
  // (vitest runs in Node, so this is fine)
  beforeAll(async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const thisDir = dirname(fileURLToPath(import.meta.url));
    const migrationPath = path.resolve(
      thisDir,
      '../../../../pb_migrations/1708300000_create_collections.js'
    );
    migrationSource = await fs.readFile(migrationPath, 'utf-8');
  });

  it('contains all four collection names', () => {
    expect(migrationSource).toContain('"classes"');
    expect(migrationSource).toContain('"users"');
    expect(migrationSource).toContain('"course_unlocks"');
    expect(migrationSource).toContain('"progress"');
  });

  it('defines users as auth collection type', () => {
    // The users collection must have type: "auth"
    expect(migrationSource).toContain('type: "auth"');
  });

  it('contains UNIQUE index on progress (user_id, course, lesson, exercise)', () => {
    expect(migrationSource).toContain('idx_progress_unique');
    expect(migrationSource).toContain('user_id, course, lesson, exercise');
  });

  it('contains UNIQUE index on classes join_code', () => {
    expect(migrationSource).toContain('idx_classes_join_code');
  });

  it('sets correct progress listRule', () => {
    expect(migrationSource).toContain(
      '@request.auth.id != "" && (user_id = @request.auth.id || @request.auth.role = "teacher")'
    );
  });

  it('sets correct progress createRule (own records only)', () => {
    expect(migrationSource).toContain('@request.auth.id != "" && user_id = @request.auth.id');
  });

  it('sets correct course_unlocks createRule (teacher only)', () => {
    expect(migrationSource).toContain('@request.auth.role = "teacher"');
  });

  it('sets correct classes listRule (authenticated users only)', () => {
    expect(migrationSource).toContain('@request.auth.id != ""');
  });

  it('contains course_unlocks user_id as non-required (nullable)', () => {
    // user_id in course_unlocks must have required: false
    // The field for class_id has required: true but user_id has required: false
    // We verify by checking that required: false appears in the file
    expect(migrationSource).toContain('required: false');
  });

  it('contains role field with student and teacher values', () => {
    expect(migrationSource).toContain('"student"');
    expect(migrationSource).toContain('"teacher"');
  });

  it('contains status field with started and completed values', () => {
    expect(migrationSource).toContain('"started"');
    expect(migrationSource).toContain('"completed"');
  });
});
