export const USERNAME_MIN_LENGTH = 3;

export function isValidUsername(username: string): boolean {
  return username.trim().length >= USERNAME_MIN_LENGTH;
}
