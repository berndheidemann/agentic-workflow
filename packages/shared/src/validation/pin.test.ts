import { describe, it, expect } from 'vitest';
import { isValidPin, PIN_LENGTH } from './pin';

describe('isValidPin', () => {
  it('accepts a standard 4-digit PIN', () => {
    expect(isValidPin('1234')).toBe(true);
  });

  it('accepts PIN with all zeros', () => {
    expect(isValidPin('0000')).toBe(true);
  });

  it('accepts PIN starting with 0', () => {
    expect(isValidPin('0123')).toBe(true);
  });

  it('rejects a PIN shorter than 4 digits', () => {
    expect(isValidPin('123')).toBe(false);
  });

  it('rejects a PIN longer than 4 digits', () => {
    expect(isValidPin('12345')).toBe(false);
  });

  it('rejects alphabetic characters', () => {
    expect(isValidPin('abcd')).toBe(false);
  });

  it('rejects mixed alphanumeric PIN', () => {
    expect(isValidPin('12a4')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidPin('')).toBe(false);
  });

  it('rejects PIN with spaces', () => {
    expect(isValidPin('12 4')).toBe(false);
  });

  it('rejects PIN with special characters', () => {
    expect(isValidPin('12.4')).toBe(false);
  });

  it('PIN_LENGTH constant is 4', () => {
    expect(PIN_LENGTH).toBe(4);
  });
});
