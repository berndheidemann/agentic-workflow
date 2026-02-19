/**
 * PIN validation.
 * Sync: pb_hooks/user-validation.pb.js must implement the same logic.
 *
 * PIN must be exactly 4 decimal digits (0-9).
 */

export const PIN_LENGTH = 4;

/** Returns true if the PIN is exactly 4 digits (0-9). */
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
