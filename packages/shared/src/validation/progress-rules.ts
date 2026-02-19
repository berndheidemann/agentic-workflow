/**
 * Progress validation rules.
 * Sync: pb_hooks/progress-validation.pb.js must implement the same logic.
 *
 * Rules:
 * - Status can only ascend: started → completed (never backward)
 * - Rate limit: max 60 progress events per hour per user
 * - Plausibility: suspicious=true if >5 completed tasks in the last minute
 */

import type { ProgressStatus } from '../schema/collections';

export const RATE_LIMIT_PER_HOUR = 60;
export const SUSPICIOUS_THRESHOLD_PER_MINUTE = 5;

const STATUS_ORDER: Record<ProgressStatus, number> = {
  started: 0,
  completed: 1,
};

/**
 * Returns true if transitioning from `current` to `next` is a valid status upgrade.
 * Same status is allowed (idempotent updates).
 */
export function isStatusUpgrade(current: ProgressStatus, next: ProgressStatus): boolean {
  return STATUS_ORDER[next] >= STATUS_ORDER[current];
}

/**
 * Returns true if the number of completed tasks in the last minute exceeds the threshold.
 * completedInLastMinute must already be filtered to the relevant time window.
 */
export function isSuspiciousRate(completedInLastMinute: number): boolean {
  return completedInLastMinute > SUSPICIOUS_THRESHOLD_PER_MINUTE;
}
