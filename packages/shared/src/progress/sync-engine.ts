import type PocketBase from 'pocketbase';
import { COLLECTION_PROGRESS } from '../schema/collections';
import type { ProgressEntry } from './types';
import { type QueuedEntry, loadQueue, saveQueue } from './offline-queue-store';

// ─── Options ──────────────────────────────────────────────────────────────────

export interface SyncEngineOptions {
  /** PocketBase instance (for API calls). */
  pb: PocketBase;
  /** ID of the currently logged-in user. */
  userId: string;
  /** Sync interval in ms. Default: 30000 (30s). */
  syncInterval?: number;
  /** Maximum retry attempts per entry before discarding. Default: 5. */
  maxRetries?: number;
  /** If false, disables localStorage persistence. Default: true. */
  persistQueue?: boolean;
}

// ─── SyncEngine ───────────────────────────────────────────────────────────────

/**
 * Framework-agnostic sync engine for progress tracking.
 *
 * Queues ProgressEntry objects and flushes them to PocketBase either:
 * - After a debounced timer (default: 30s after last enqueue)
 * - When the page visibility changes to "hidden"
 * - When the browser comes back online (after being offline)
 * - When stop() is called
 *
 * Uses try-create-catch-update (optimistic upsert):
 * First attempts create(), falls back to getFirstListItem() + update() on conflict.
 *
 * Offline support (REQ-034):
 * - Queue is persisted to localStorage on every enqueue/flush
 * - On construction, existing queue is loaded from localStorage
 * - When offline (navigator.onLine === false), flush() is skipped
 * - Failed entries are re-queued with an incremented retryCount
 * - Entries exceeding maxRetries are permanently discarded
 * - On reconnect (window 'online' event), flush() is triggered automatically
 */
export class SyncEngine {
  private readonly pb: PocketBase;
  private readonly userId: string;
  private readonly syncInterval: number;
  private readonly maxRetries: number;
  private readonly persistQueueEnabled: boolean;

  private queue: QueuedEntry[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private _isSyncing = false;
  private changeCallbacks: Set<() => void> = new Set();

  constructor({
    pb,
    userId,
    syncInterval = 30_000,
    maxRetries = 5,
    persistQueue = true,
  }: SyncEngineOptions) {
    this.pb = pb;
    this.userId = userId;
    this.syncInterval = syncInterval;
    this.maxRetries = maxRetries;
    this.persistQueueEnabled = persistQueue;

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleOnline = this.handleOnline.bind(this);

    // Load persisted queue from localStorage on startup
    if (this.persistQueueEnabled) {
      const persisted = loadQueue(userId);
      if (persisted.length > 0) {
        this.queue = persisted;
        this.notifyChange();
      }
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  get pendingCount(): number {
    return this.queue.length;
  }

  get isSyncing(): boolean {
    return this._isSyncing;
  }

  /** True when navigator.onLine is false. */
  get isOffline(): boolean {
    return typeof navigator !== 'undefined' && !navigator.onLine;
  }

  /** Registers a callback to be called whenever pendingCount or isSyncing changes. */
  onChange(callback: () => void): () => void {
    this.changeCallbacks.add(callback);
    return () => {
      this.changeCallbacks.delete(callback);
    };
  }

  /** Adds a progress entry to the queue and resets the debounce timer. */
  enqueue(entry: ProgressEntry): void {
    const queued: QueuedEntry = {
      ...entry,
      retryCount: 0,
      queuedAt: new Date().toISOString(),
    };
    this.queue.push(queued);
    this.notifyChange();
    this.persistIfEnabled();
    this.resetTimer();
  }

  /** Flushes all queued entries to PocketBase immediately. */
  async flush(): Promise<void> {
    // Skip flush when offline — entries stay in queue and localStorage
    if (this.isOffline) return;
    if (this.queue.length === 0) return;

    const toSync = this.queue.splice(0, this.queue.length);
    this._isSyncing = true;
    this.notifyChange();

    const failed: QueuedEntry[] = [];

    try {
      await Promise.all(
        toSync.map(async (entry) => {
          try {
            await this.upsertEntry(entry);
          } catch {
            // Re-queue with incremented retryCount unless max retries exceeded
            const retryCount = entry.retryCount + 1;
            if (retryCount < this.maxRetries) {
              failed.push({ ...entry, retryCount });
            }
          }
        })
      );
    } finally {
      // Put failed entries back at the front of the queue
      if (failed.length > 0) {
        this.queue = [...failed, ...this.queue];
      }
      this._isSyncing = false;
      this.notifyChange();
      this.persistIfEnabled();
    }
  }

  /** Starts the visibility and online listeners. */
  start(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
    }
  }

  /** Stops the engine: flushes remaining queue, removes listeners, clears timer. */
  async stop(): Promise<void> {
    this.clearTimer();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
    }
    // Persist before final flush attempt (in case flush fails while offline)
    this.persistIfEnabled();
    await this.flush();
  }

  // ─── Private methods ────────────────────────────────────────────────────────

  private handleVisibilityChange(): void {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      void this.flush();
    }
  }

  private handleOnline(): void {
    void this.flush();
  }

  private persistIfEnabled(): void {
    if (this.persistQueueEnabled) {
      saveQueue(this.userId, this.queue);
    }
  }

  private resetTimer(): void {
    this.clearTimer();
    this.timer = setTimeout(() => {
      void this.flush();
    }, this.syncInterval);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private notifyChange(): void {
    this.changeCallbacks.forEach((cb) => cb());
  }

  private async upsertEntry(entry: ProgressEntry): Promise<void> {
    const status = entry.score >= entry.maxScore ? 'completed' : 'started';
    const data = {
      user_id: this.userId,
      course: entry.course,
      lesson: entry.lesson,
      exercise: entry.exercise,
      status,
      score: entry.score,
      max_score: entry.maxScore,
      completed_at: status === 'completed' ? entry.completedAt : null,
    };

    try {
      // Optimistic create — happy path for first attempt at an exercise
      await this.pb.collection(COLLECTION_PROGRESS).create(data);
    } catch {
      // UNIQUE constraint violation → update existing record
      const filter = `user_id = "${this.userId}" && course = "${entry.course}" && lesson = "${entry.lesson}" && exercise = "${entry.exercise}"`;
      const existing = await this.pb.collection(COLLECTION_PROGRESS).getFirstListItem(filter);

      await this.pb.collection(COLLECTION_PROGRESS).update(existing.id, {
        score: entry.score,
        max_score: entry.maxScore,
        status,
        completed_at: status === 'completed' ? entry.completedAt : null,
        attempts: ((existing['attempts'] as number) ?? 0) + 1,
      });
    }
  }
}
