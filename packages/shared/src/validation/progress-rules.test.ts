import { describe, it, expect } from 'vitest';
import {
  isStatusUpgrade,
  isSuspiciousRate,
  RATE_LIMIT_PER_HOUR,
  SUSPICIOUS_THRESHOLD_PER_MINUTE,
} from './progress-rules';

describe('isStatusUpgrade', () => {
  it('allows started → completed', () => {
    expect(isStatusUpgrade('started', 'completed')).toBe(true);
  });

  it('allows started → started (idempotent)', () => {
    expect(isStatusUpgrade('started', 'started')).toBe(true);
  });

  it('allows completed → completed (idempotent)', () => {
    expect(isStatusUpgrade('completed', 'completed')).toBe(true);
  });

  it('rejects completed → started (downgrade)', () => {
    expect(isStatusUpgrade('completed', 'started')).toBe(false);
  });
});

describe('isSuspiciousRate', () => {
  it('returns false for 0 completed tasks in the last minute', () => {
    expect(isSuspiciousRate(0)).toBe(false);
  });

  it('returns false for exactly 5 completed tasks (boundary: not suspicious)', () => {
    expect(isSuspiciousRate(5)).toBe(false);
  });

  it('returns true for 6 completed tasks (boundary: suspicious)', () => {
    expect(isSuspiciousRate(6)).toBe(true);
  });

  it('returns true for many completed tasks', () => {
    expect(isSuspiciousRate(100)).toBe(true);
  });
});

describe('constants', () => {
  it('RATE_LIMIT_PER_HOUR is 60', () => {
    expect(RATE_LIMIT_PER_HOUR).toBe(60);
  });

  it('SUSPICIOUS_THRESHOLD_PER_MINUTE is 5', () => {
    expect(SUSPICIOUS_THRESHOLD_PER_MINUTE).toBe(5);
  });
});
