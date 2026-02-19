// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncEngine } from './sync-engine';
import type { ProgressEntry } from './types';
import { loadQueue, storageKeyFor } from './offline-queue-store';

// ─── PocketBase mock ──────────────────────────────────────────────────────────

const mockCreate = vi.fn();
const mockGetFirstListItem = vi.fn();
const mockUpdate = vi.fn();

const mockCollection = vi.fn().mockReturnValue({
  create: mockCreate,
  getFirstListItem: mockGetFirstListItem,
  update: mockUpdate,
});

const mockPb = { collection: mockCollection } as unknown as import('pocketbase').default;

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<ProgressEntry> = {}): ProgressEntry {
  return {
    course: 'ap1',
    lesson: 'modul-1',
    exercise: 'aufgabe-1',
    score: 1,
    maxScore: 1,
    completedAt: '2026-02-18T00:00:00.000Z',
    ...overrides,
  };
}

function makeEngine(syncInterval = 30_000): SyncEngine {
  return new SyncEngine({ pb: mockPb, userId: 'user-123', syncInterval });
}

function makeEngineNoPersist(syncInterval = 30_000): SyncEngine {
  return new SyncEngine({ pb: mockPb, userId: 'user-123', syncInterval, persistQueue: false });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SyncEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
    // Default: navigator.onLine = true
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('pendingCount', () => {
    it('starts at 0', () => {
      const engine = makeEngine();
      expect(engine.pendingCount).toBe(0);
    });

    it('increases when entries are enqueued', () => {
      const engine = makeEngine();
      engine.enqueue(makeEntry());
      expect(engine.pendingCount).toBe(1);
      engine.enqueue(makeEntry({ exercise: 'aufgabe-2' }));
      expect(engine.pendingCount).toBe(2);
    });
  });

  describe('flush (empty queue)', () => {
    it('resolves immediately without API calls', async () => {
      const engine = makeEngine();
      await engine.flush();
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('flush (create path)', () => {
    it('calls create with correct fields', async () => {
      mockCreate.mockResolvedValueOnce({});
      const engine = makeEngine();
      engine.enqueue(makeEntry({ score: 1, maxScore: 1 }));

      await engine.flush();

      expect(mockCreate).toHaveBeenCalledOnce();
      expect(mockCreate).toHaveBeenCalledWith({
        user_id: 'user-123',
        course: 'ap1',
        lesson: 'modul-1',
        exercise: 'aufgabe-1',
        status: 'completed',
        score: 1,
        max_score: 1,
        completed_at: '2026-02-18T00:00:00.000Z',
      });
    });

    it('sets status to "started" when score < maxScore', async () => {
      mockCreate.mockResolvedValueOnce({});
      const engine = makeEngine();
      engine.enqueue(makeEntry({ score: 0, maxScore: 1 }));

      await engine.flush();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'started', completed_at: null })
      );
    });

    it('flushes all entries from the queue', async () => {
      mockCreate.mockResolvedValue({});
      const engine = makeEngine();
      engine.enqueue(makeEntry({ exercise: 'aufgabe-1' }));
      engine.enqueue(makeEntry({ exercise: 'aufgabe-2' }));

      await engine.flush();

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(engine.pendingCount).toBe(0);
    });
  });

  describe('flush (upsert fallback)', () => {
    it('falls back to update when create fails', async () => {
      mockCreate.mockRejectedValueOnce(new Error('unique constraint'));
      mockGetFirstListItem.mockResolvedValueOnce({ id: 'rec-1', attempts: 2 });
      mockUpdate.mockResolvedValueOnce({});

      const engine = makeEngine();
      engine.enqueue(makeEntry());
      await engine.flush();

      expect(mockGetFirstListItem).toHaveBeenCalledOnce();
      expect(mockUpdate).toHaveBeenCalledWith('rec-1', expect.objectContaining({ attempts: 3 }));
    });

    it('silently ignores entries when both create and update fail', async () => {
      mockCreate.mockRejectedValueOnce(new Error('create failed'));
      mockGetFirstListItem.mockRejectedValueOnce(new Error('update failed'));

      const engine = makeEngine();
      engine.enqueue(makeEntry());

      // Should not throw
      await expect(engine.flush()).resolves.toBeUndefined();
    });
  });

  describe('isSyncing', () => {
    it('is false before flush', () => {
      const engine = makeEngine();
      engine.enqueue(makeEntry());
      expect(engine.isSyncing).toBe(false);
    });

    it('is true during flush and false after', async () => {
      let resolveFn!: () => void;
      mockCreate.mockImplementationOnce(
        () => new Promise<void>((resolve) => (resolveFn = resolve))
      );

      const engine = makeEngine();
      engine.enqueue(makeEntry());

      const flushPromise = engine.flush();
      expect(engine.isSyncing).toBe(true);

      resolveFn();
      await flushPromise;
      expect(engine.isSyncing).toBe(false);
    });
  });

  describe('timer', () => {
    it('flushes after the sync interval', async () => {
      mockCreate.mockResolvedValue({});
      const engine = makeEngine(1000);
      engine.start();
      engine.enqueue(makeEntry());

      expect(mockCreate).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1000);
      expect(mockCreate).toHaveBeenCalledOnce();

      await engine.stop();
    });

    it('does not flush before the interval', async () => {
      mockCreate.mockResolvedValue({});
      const engine = makeEngine(1000);
      engine.start();
      engine.enqueue(makeEntry());

      await vi.advanceTimersByTimeAsync(500);
      expect(mockCreate).not.toHaveBeenCalled();

      await engine.stop();
    });
  });

  describe('visibilitychange', () => {
    it('flushes when page becomes hidden', async () => {
      mockCreate.mockResolvedValue({});
      const engine = makeEngine();
      engine.start();
      engine.enqueue(makeEntry());

      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      await vi.runAllTimersAsync();
      expect(mockCreate).toHaveBeenCalledOnce();

      await engine.stop();
    });

    it('does not flush when page becomes visible', async () => {
      mockCreate.mockResolvedValue({});
      // Use a long interval so the timer doesn't fire during the test
      const engine = new SyncEngine({ pb: mockPb, userId: 'user-123', syncInterval: 60_000 });
      engine.start();
      engine.enqueue(makeEntry());

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Advance time, but not enough to trigger the 60s timer
      await vi.advanceTimersByTimeAsync(100);
      expect(mockCreate).not.toHaveBeenCalled();

      await engine.stop();
    });
  });

  describe('stop', () => {
    it('flushes remaining queue on stop', async () => {
      mockCreate.mockResolvedValue({});
      const engine = makeEngine();
      engine.start();
      engine.enqueue(makeEntry());

      await engine.stop();
      expect(mockCreate).toHaveBeenCalledOnce();
    });

    it('removes visibilitychange listener after stop', async () => {
      mockCreate.mockResolvedValue({});
      const engine = makeEngine();
      engine.start();
      await engine.stop();

      // After stop, enqueue and trigger visibility — should not flush again
      engine.enqueue(makeEntry({ exercise: 'aufgabe-2' }));
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.runAllTimersAsync();

      // Only the flush from stop() should have been called
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('onChange', () => {
    it('calls callback when entries are enqueued', () => {
      const cb = vi.fn();
      const engine = makeEngine();
      engine.onChange(cb);

      engine.enqueue(makeEntry());
      expect(cb).toHaveBeenCalledOnce();
    });

    it('returns unsubscribe function', () => {
      const cb = vi.fn();
      const engine = makeEngine();
      const unsubscribe = engine.onChange(cb);

      unsubscribe();
      engine.enqueue(makeEntry());
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('offline detection', () => {
    it('isOffline returns false when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      const engine = makeEngineNoPersist();
      expect(engine.isOffline).toBe(false);
    });

    it('isOffline returns true when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      const engine = makeEngineNoPersist();
      expect(engine.isOffline).toBe(true);
    });

    it('flush() makes no API calls when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      const engine = makeEngineNoPersist();
      engine.enqueue(makeEntry());

      await engine.flush();

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('queue stays intact after offline flush', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      const engine = makeEngineNoPersist();
      engine.enqueue(makeEntry());
      engine.enqueue(makeEntry({ exercise: 'aufgabe-2' }));

      await engine.flush();

      expect(engine.pendingCount).toBe(2);
    });
  });

  describe('online event (auto reconnect)', () => {
    it('flushes when online event fires', async () => {
      mockCreate.mockResolvedValue({});
      const engine = makeEngineNoPersist();
      engine.start();
      engine.enqueue(makeEntry());

      // Simulate going online
      window.dispatchEvent(new Event('online'));
      await vi.runAllTimersAsync();

      expect(mockCreate).toHaveBeenCalledOnce();
      await engine.stop();
    });

    it('removes online listener after stop', async () => {
      mockCreate.mockResolvedValue({});
      const engine = makeEngineNoPersist();
      engine.start();
      await engine.stop();

      // Spy on flush to confirm it's not called by the online event
      const flushSpy = vi.spyOn(engine, 'flush');

      window.dispatchEvent(new Event('online'));
      await vi.runAllTimersAsync();

      expect(flushSpy).not.toHaveBeenCalled();
    });
  });

  describe('retry logic', () => {
    it('re-queues failed entries with incremented retryCount', async () => {
      mockCreate.mockRejectedValue(new Error('network error'));
      mockGetFirstListItem.mockRejectedValue(new Error('network error'));

      const engine = makeEngineNoPersist();
      engine.enqueue(makeEntry());

      await engine.flush();

      expect(engine.pendingCount).toBe(1);
    });

    it('discards entries that exceed maxRetries', async () => {
      mockCreate.mockRejectedValue(new Error('network error'));
      mockGetFirstListItem.mockRejectedValue(new Error('network error'));

      const engine = new SyncEngine({
        pb: mockPb,
        userId: 'user-123',
        maxRetries: 2,
        persistQueue: false,
      });
      engine.enqueue(makeEntry());

      // Each flush increments retryCount; at retryCount >= maxRetries, entry is discarded
      await engine.flush(); // retryCount = 1
      expect(engine.pendingCount).toBe(1);

      await engine.flush(); // retryCount = 2 → discarded (2 >= maxRetries 2)
      expect(engine.pendingCount).toBe(0);
    });

    it('keeps successful entries out of re-queue', async () => {
      // First entry fails, second succeeds
      mockCreate
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce({});
      mockGetFirstListItem.mockRejectedValueOnce(new Error('network error'));

      const engine = makeEngineNoPersist();
      engine.enqueue(makeEntry({ exercise: 'aufgabe-1' }));
      engine.enqueue(makeEntry({ exercise: 'aufgabe-2' }));

      await engine.flush();

      // Only failed entry remains
      expect(engine.pendingCount).toBe(1);
    });
  });

  describe('localStorage persistence', () => {
    it('saves queue to localStorage on enqueue', () => {
      const engine = makeEngine();
      engine.enqueue(makeEntry());

      const stored = loadQueue('user-123');
      expect(stored).toHaveLength(1);
      expect(stored[0].exercise).toBe('aufgabe-1');
    });

    it('loads persisted queue on construction', () => {
      // Pre-populate localStorage
      const engine1 = makeEngine();
      engine1.enqueue(makeEntry({ exercise: 'aufgabe-1' }));
      engine1.enqueue(makeEntry({ exercise: 'aufgabe-2' }));

      // New engine should load from localStorage
      const engine2 = makeEngine();
      expect(engine2.pendingCount).toBe(2);
    });

    it('updates localStorage after successful flush', async () => {
      mockCreate.mockResolvedValue({});
      const engine = makeEngine();
      engine.enqueue(makeEntry());

      await engine.flush();

      const stored = loadQueue('user-123');
      expect(stored).toHaveLength(0);
    });

    it('persists failed entries to localStorage after flush', async () => {
      mockCreate.mockRejectedValue(new Error('network error'));
      mockGetFirstListItem.mockRejectedValue(new Error('network error'));

      const engine = makeEngine();
      engine.enqueue(makeEntry());

      await engine.flush();

      const stored = loadQueue('user-123');
      expect(stored).toHaveLength(1);
      expect(stored[0].retryCount).toBe(1);
    });

    it('persists queue to localStorage on stop()', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      const engine = makeEngine();
      engine.enqueue(makeEntry());

      await engine.stop();

      const stored = loadQueue('user-123');
      expect(stored).toHaveLength(1);
    });

    it('does not persist when persistQueue is false', () => {
      const engine = makeEngineNoPersist();
      engine.enqueue(makeEntry());

      const stored = loadQueue('user-123');
      expect(stored).toHaveLength(0);
    });

    it('uses user-specific storage keys', () => {
      const engine1 = new SyncEngine({ pb: mockPb, userId: 'user-aaa' });
      const engine2 = new SyncEngine({ pb: mockPb, userId: 'user-bbb' });

      engine1.enqueue(makeEntry({ exercise: 'aaa-1' }));
      engine2.enqueue(makeEntry({ exercise: 'bbb-1' }));

      const queueA = loadQueue('user-aaa');
      const queueB = loadQueue('user-bbb');

      expect(queueA).toHaveLength(1);
      expect(queueB).toHaveLength(1);
      expect(queueA[0].exercise).toBe('aaa-1');
      expect(queueB[0].exercise).toBe('bbb-1');

      expect(localStorage.getItem(storageKeyFor('user-aaa'))).not.toBeNull();
      expect(localStorage.getItem(storageKeyFor('user-bbb'))).not.toBeNull();
    });
  });
});
