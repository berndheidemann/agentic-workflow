import { BaseAuthStore } from 'pocketbase';
import type { AuthRecord } from 'pocketbase';
import type { CookieAuthStoreOptions } from './types';

/**
 * PocketBase AuthStore that persists auth state in a browser cookie.
 *
 * Uses PocketBase's built-in exportToCookie/loadFromCookie for consistent
 * serialization format. Cookie is readable by JS (not httpOnly) because
 * the PocketBase SDK manages it client-side.
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
    this.secure =
      options.secure ?? (typeof location !== 'undefined' && location.protocol === 'https:');
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
    const cookieStr = this.exportToCookie(
      {
        path: this.path,
        secure: this.secure,
        sameSite: this.sameSite,
        domain: this.domain,
        httpOnly: false,
        expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      this.cookieName
    );
    document.cookie = cookieStr;
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
