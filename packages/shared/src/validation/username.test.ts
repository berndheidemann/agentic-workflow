import { describe, it, expect } from 'vitest';
import { isValidUsername, USERNAME_MIN_LENGTH } from './username';

describe('USERNAME_MIN_LENGTH', () => {
  it('ist 3', () => {
    expect(USERNAME_MIN_LENGTH).toBe(3);
  });
});

describe('isValidUsername', () => {
  it('gibt false zurück bei leerem String', () => {
    expect(isValidUsername('')).toBe(false);
  });

  it('gibt false zurück bei String mit nur Leerzeichen', () => {
    expect(isValidUsername('   ')).toBe(false);
  });

  it('gibt false zurück bei 1 Zeichen', () => {
    expect(isValidUsername('a')).toBe(false);
  });

  it('gibt false zurück bei 2 Zeichen', () => {
    expect(isValidUsername('ab')).toBe(false);
  });

  it('gibt true zurück bei genau 3 Zeichen', () => {
    expect(isValidUsername('abc')).toBe(true);
  });

  it('gibt true zurück bei mehr als 3 Zeichen', () => {
    expect(isValidUsername('testuser')).toBe(true);
  });

  it('trimmt Whitespace vor Längenprüfung', () => {
    expect(isValidUsername('  ab  ')).toBe(false);
    expect(isValidUsername('  abc  ')).toBe(true);
  });
});
