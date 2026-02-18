import type PocketBase from 'pocketbase';
import { COLLECTION_PROGRESS } from '../schema/collections';
import type { ProgressEntry } from './types';

// ─── Options ──────────────────────────────────────────────────────────────────

export interface SyncEngineOptions {
  /** PocketBase instance (for API calls). */
  pb: PocketBase;
  /** ID of the currently logged-in user. */
  userId: string;
  /** Sync interval in ms. Default: 30000 (30s). */
  syncInterval?: number;
}

// ─── SyncEngine ───────────────────────────────────────────────────────────────

/**
 * Framework-agnostic sync engine for progress tracking.
 *
 * Queues ProgressEntry objects and flushes them to PocketBase either:
 * - After a debounced timer (default: 30s after last enqueue)
 * - When the page visibility changes to "hidden"
 * - When stop() is called
 *
 * Uses try-create-catch-update (optimistic upsert):
 * First attempts create(), falls back to getFirstListItem() + update() on conflict.
 */
export class SyncEngine {
  private readonly pb: PocketBase;
  private readonly userId: string;
  private readonly syncInterval: number;

  private queue: ProgressEntry[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private _isSyncing = false;
  private changeCallbacks: Set<() => void> = new Set();

  constructor({ pb, userId, syncInterval = 30_000 }: SyncEngineOptions) {
    this.pb = pb;
    this.userId = userId;
    this.syncInterval = syncInterval;
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  get pendingCount(): number {
    return this.queue.length;
  }

  get isSyncing(): boolean {
    return this._isSyncing;
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
    this.queue.push(entry);
    this.notifyChange();
    this.resetTimer();
  }

  /** Flushes all queued entries to PocketBase immediately. */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const toSync = this.queue.splice(0, this.queue.length);
    this._isSyncing = true;
    this.notifyChange();

    try {
      await Promise.all(toSync.map((entry) => this.upsertEntry(entry)));
    } finally {
      this._isSyncing = false;
      this.notifyChange();
    }
  }

  /** Starts the visibility listener. */
  start(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  /** Stops the engine: flushes remaining queue, removes listeners, clears timer. */
  async stop(): Promise<void> {
    this.clearTimer();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    await this.flush();
  }

  // ─── Private methods ────────────────────────────────────────────────────────

  private handleVisibilityChange(): void {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      void this.flush();
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
      try {
        const filter = `user_id = "${this.userId}" && course = "${entry.course}" && lesson = "${entry.lesson}" && exercise = "${entry.exercise}"`;
        const existing = await this.pb
          .collection(COLLECTION_PROGRESS)
          .getFirstListItem(filter);

        await this.pb.collection(COLLECTION_PROGRESS).update(existing.id, {
          score: entry.score,
          max_score: entry.maxScore,
          status,
          completed_at: status === 'completed' ? entry.completedAt : null,
          attempts: (existing['attempts'] as number ?? 0) + 1,
        });
      } catch {
        // If upsert fails, silently skip — entry was already removed from queue.
        // Future: could re-queue for offline support (REQ-034).
      }
    }
  }
}
