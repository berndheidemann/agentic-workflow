import type { ProgressEntry } from './types';

// ─── Types ─────────────────────────────────────────────────────────────────────

/** A progress entry with retry metadata for offline persistence. */
export interface QueuedEntry extends ProgressEntry {
  /** Number of failed sync attempts. Starts at 0. */
  retryCount: number;
  /** ISO timestamp when the entry was first queued. */
  queuedAt: string;
}

// ─── Storage key ───────────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'lernplattform:progress-queue';

export function storageKeyFor(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

// ─── Type guard ────────────────────────────────────────────────────────────────

function isQueuedEntry(value: unknown): value is QueuedEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['course'] === 'string' &&
    typeof v['lesson'] === 'string' &&
    typeof v['exercise'] === 'string' &&
    typeof v['score'] === 'number' &&
    typeof v['maxScore'] === 'number' &&
    typeof v['completedAt'] === 'string' &&
    typeof v['retryCount'] === 'number' &&
    typeof v['queuedAt'] === 'string'
  );
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Reads the persisted queue from localStorage for a given user.
 * Returns empty array if nothing stored, on parse error, or invalid shape.
 */
export function loadQueue(userId: string): QueuedEntry[] {
  try {
    const raw = localStorage.getItem(storageKeyFor(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isQueuedEntry);
  } catch {
    return [];
  }
}

/**
 * Writes the queue to localStorage for a given user.
 * Silently ignores errors (e.g. localStorage full / not available).
 */
export function saveQueue(userId: string, entries: QueuedEntry[]): void {
  try {
    localStorage.setItem(storageKeyFor(userId), JSON.stringify(entries));
  } catch {
    // Graceful degradation — queue is still in memory, just not persisted
  }
}

/**
 * Removes the queue from localStorage for a given user.
 */
export function clearQueue(userId: string): void {
  try {
    localStorage.removeItem(storageKeyFor(userId));
  } catch {
    // Ignore
  }
}
