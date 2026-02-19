import PocketBase from 'pocketbase';
import { CookieAuthStore } from './cookie-auth-store';
import type { CookieAuthStoreOptions } from './types';

/**
 * Creates a PocketBase client with a CookieAuthStore for auth persistence.
 *
 * @param baseUrl - PocketBase base URL. Default '' uses Vite proxy (/api/).
 * @param cookieOptions - Cookie configuration for auth persistence.
 */
export function createPocketBaseClient(
  baseUrl: string = '',
  cookieOptions?: CookieAuthStoreOptions
): PocketBase {
  const authStore = new CookieAuthStore(cookieOptions);
  return new PocketBase(baseUrl, authStore);
}
