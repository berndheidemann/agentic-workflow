import { describe, it, expect } from 'vitest';
import {
  generateJoinCode,
  isValidJoinCode,
  JOIN_CODE_CHARSET,
  JOIN_CODE_LENGTH,
} from './join-code';

describe('generateJoinCode', () => {
  it('returns a string of exactly 6 characters', () => {
    const code = generateJoinCode();
    expect(code).toHaveLength(JOIN_CODE_LENGTH);
  });

  it('uses only characters from the allowed charset', () => {
    const code = generateJoinCode();
    for (const ch of code) {
      expect(JOIN_CODE_CHARSET).toContain(ch);
    }
  });

  it('does not contain confusable characters (0, O, 1, I)', () => {
    // Excluded from charset: 0 (confusable with O), O, 1 (confusable with I), I
    // Run 200 times to reduce false-negative probability
    for (let i = 0; i < 200; i++) {
      const code = generateJoinCode();
      expect(code).not.toMatch(/[0O1I]/);
    }
  });

  it('produces varied output across multiple calls', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateJoinCode()));
    // With 32^6 possible codes, 100 calls should yield at least 90 unique results
    expect(codes.size).toBeGreaterThan(90);
  });
});

describe('isValidJoinCode', () => {
  it('accepts a valid 6-character code from the charset', () => {
    expect(isValidJoinCode('ABC234')).toBe(true);
  });

  it('accepts a code with all uppercase and digits from charset', () => {
    expect(isValidJoinCode('HJKLMN')).toBe(true);
  });

  it('rejects lowercase letters', () => {
    expect(isValidJoinCode('abc234')).toBe(false);
  });

  it('rejects codes shorter than 6 characters', () => {
    expect(isValidJoinCode('ABCDE')).toBe(false);
  });

  it('rejects codes longer than 6 characters', () => {
    expect(isValidJoinCode('ABCDEFG')).toBe(false);
  });

  it('rejects code containing 0 (confusable with O)', () => {
    expect(isValidJoinCode('ABCDE0')).toBe(false);
  });

  it('rejects code containing I (confusable with 1)', () => {
    expect(isValidJoinCode('ABCDEI')).toBe(false);
  });

  it('rejects code containing O (confusable with 0)', () => {
    expect(isValidJoinCode('ABCDEO')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidJoinCode('')).toBe(false);
  });

  it('rejects code with special characters', () => {
    expect(isValidJoinCode('ABC!23')).toBe(false);
  });
});
