/**
 * Join-code generation and validation.
 * Sync: pb_hooks/join-code.pb.js must implement the same logic.
 *
 * Design: no confusable characters (no 0/O, no 1/I/L).
 */

export const JOIN_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const JOIN_CODE_LENGTH = 6;

/** Generates a random 6-character join code from the allowed charset. */
export function generateJoinCode(): string {
  let code = '';
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += JOIN_CODE_CHARSET[Math.floor(Math.random() * JOIN_CODE_CHARSET.length)];
  }
  return code;
}

/** Returns true if the code is exactly 6 characters from the allowed charset. */
export function isValidJoinCode(code: string): boolean {
  if (code.length !== JOIN_CODE_LENGTH) return false;
  const pattern = new RegExp(`^[${JOIN_CODE_CHARSET}]+$`);
  return pattern.test(code);
}
