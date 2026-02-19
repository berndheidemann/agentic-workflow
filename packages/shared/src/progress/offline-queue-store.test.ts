// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadQueue,
  saveQueue,
  clearQueue,
  storageKeyFor,
  type QueuedEntry,
} from './offline-queue-store';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeQueuedEntry(overrides: Partial<QueuedEntry> = {}): QueuedEntry {
  return {
    course: 'ap1',
    lesson: 'modul-1',
    exercise: 'aufgabe-1',
    score: 1,
    maxScore: 1,
    completedAt: '2026-02-19T10:00:00.000Z',
    retryCount: 0,
    queuedAt: '2026-02-19T10:00:00.000Z',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('storageKeyFor', () => {
  it('includes the userId in the key', () => {
    expect(storageKeyFor('user-123')).toBe('lernplattform:progress-queue:user-123');
  });

  it('produces different keys for different users', () => {
    expect(storageKeyFor('user-a')).not.toBe(storageKeyFor('user-b'));
  });
});

describe('loadQueue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when localStorage is empty', () => {
    expect(loadQueue('user-123')).toEqual([]);
  });

  it('returns empty array when key does not exist', () => {
    expect(loadQueue('unknown-user')).toEqual([]);
  });

  it('returns empty array on corrupt JSON', () => {
    localStorage.setItem(storageKeyFor('user-123'), 'not valid json {{{');
    expect(loadQueue('user-123')).toEqual([]);
  });

  it('returns empty array when stored value is not an array', () => {
    localStorage.setItem(storageKeyFor('user-123'), JSON.stringify({ foo: 'bar' }));
    expect(loadQueue('user-123')).toEqual([]);
  });

  it('returns empty array when entries are missing required fields', () => {
    const invalid = [{ course: 'ap1' }]; // missing lesson, exercise, etc.
    localStorage.setItem(storageKeyFor('user-123'), JSON.stringify(invalid));
    expect(loadQueue('user-123')).toEqual([]);
  });

  it('filters out invalid entries and keeps valid ones', () => {
    const valid = makeQueuedEntry();
    const invalid = { course: 'ap1' }; // incomplete
    localStorage.setItem(storageKeyFor('user-123'), JSON.stringify([valid, invalid]));
    const result = loadQueue('user-123');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(valid);
  });
});

describe('saveQueue + loadQueue (roundtrip)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and restores an empty queue', () => {
    saveQueue('user-123', []);
    expect(loadQueue('user-123')).toEqual([]);
  });

  it('persists and restores a single entry', () => {
    const entry = makeQueuedEntry();
    saveQueue('user-123', [entry]);
    expect(loadQueue('user-123')).toEqual([entry]);
  });

  it('persists and restores multiple entries with retryCount', () => {
    const entries = [makeQueuedEntry({ retryCount: 0 }), makeQueuedEntry({ exercise: 'aufgabe-2', retryCount: 2 })];
    saveQueue('user-123', entries);
    expect(loadQueue('user-123')).toEqual(entries);
  });

  it('isolates queues per userId', () => {
    const entryA = makeQueuedEntry({ course: 'ap1' });
    const entryB = makeQueuedEntry({ course: 'numpy' });
    saveQueue('user-a', [entryA]);
    saveQueue('user-b', [entryB]);
    expect(loadQueue('user-a')).toEqual([entryA]);
    expect(loadQueue('user-b')).toEqual([entryB]);
  });
});

describe('clearQueue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes the queue from localStorage', () => {
    saveQueue('user-123', [makeQueuedEntry()]);
    clearQueue('user-123');
    expect(loadQueue('user-123')).toEqual([]);
    expect(localStorage.getItem(storageKeyFor('user-123'))).toBeNull();
  });

  it('does not throw when key does not exist', () => {
    expect(() => clearQueue('nonexistent-user')).not.toThrow();
  });
});

describe('saveQueue error handling', () => {
  it('does not throw when localStorage is unavailable', () => {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveQueue('user-123', [makeQueuedEntry()])).not.toThrow();
    vi.spyOn(localStorage, 'setItem').mockImplementation(originalSetItem);
  });
});
