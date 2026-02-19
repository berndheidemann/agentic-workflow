import { BaseAuthStore } from 'pocketbase';
import type { AuthRecord } from 'pocketbase';
import type { CookieAuthStoreOptions } from './types';

/**
 * PocketBase AuthStore that persists auth state in a browser cookie.
 *
 * Cookie is readable by JS (not httpOnly) because the PocketBase SDK
 * manages it client-side — this matches the official PocketBase cookie pattern.
 *
 * Auth state persists for 14 days and survives page reloads.
 */
export class CookieAuthStore extends BaseAuthStore {
  private readonly cookieName: string;
  private readonly domain: string | undefined;
  private readonly path: string;
  private readonly secure: boolean;
  private readonly sameSite: 'Strict' | 'Lax' | 'None';

  constructor(options: CookieAuthStoreOptions = {}) {
    super();
    this.cookieName = options.cookieName ?? 'pb_auth';
    this.domain = options.domain;
    this.path = options.path ?? '/';
    this.secure = options.secure ?? true;
    this.sameSite = options.sameSite ?? 'Lax';

    // Rehydrate from existing cookie on construction
    if (typeof document !== 'undefined') {
      this.loadFromCookie(document.cookie, this.cookieName);
    }
  }

  override save(token: string, record?: AuthRecord): void {
    super.save(token, record);
    this.writeCookie();
  }

  override clear(): void {
    super.clear();
    this.expireCookie();
  }

  private writeCookie(): void {
    if (typeof document === 'undefined') return;
    const value = encodeURIComponent(JSON.stringify({ token: this.token, record: this.record }));
    let cookie = `${this.cookieName}=${value}`;
    cookie += `; path=${this.path}`;
    cookie += `; SameSite=${this.sameSite}`;
    if (this.secure) cookie += '; Secure';
    if (this.domain) cookie += `; domain=${this.domain}`;
    const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    cookie += `; expires=${expires.toUTCString()}`;
    document.cookie = cookie;
  }

  private expireCookie(): void {
    if (typeof document === 'undefined') return;
    let cookie = `${this.cookieName}=`;
    cookie += `; path=${this.path}`;
    if (this.domain) cookie += `; domain=${this.domain}`;
    cookie += '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = cookie;
  }
}
