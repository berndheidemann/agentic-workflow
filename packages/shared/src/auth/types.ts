import type React from 'react';
import type PocketBase from 'pocketbase';
import type { UserRole } from '../schema/collections';

// ─── User types ───────────────────────────────────────────────────────────────

/**
 * Normalized user object exposed via useAuth().
 * Maps PocketBase AuthRecord fields to camelCase.
 */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  classId: string | null;
  displayName: string;
  verified: boolean;
}

// ─── Auth state ───────────────────────────────────────────────────────────────

export interface AuthState {
  isLoggedIn: boolean;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

// ─── Context value ────────────────────────────────────────────────────────────

export interface AuthContextValue extends AuthState {
  /** Login with username and 4-digit PIN. classCode is used during registration, not login. */
  login: (username: string, pin: string) => Promise<void>;
  /** Register a new student account and auto-login. Throws on invalid classCode or duplicate username. */
  register: (username: string, pin: string, classCode: string) => Promise<void>;
  logout: () => void;
  /** Exposed for advanced use cases (e.g. progress tracking, unlock queries). */
  pb: PocketBase;
}

// ─── Cookie options ───────────────────────────────────────────────────────────

export interface CookieAuthStoreOptions {
  /** Cookie name. Default: 'pb_auth' */
  cookieName?: string;
  /** Domain for the cookie (e.g. '.szut.dev' for cross-subdomain). Optional. */
  domain?: string;
  /** Cookie path. Default: '/' */
  path?: string;
  /** Whether to set Secure flag. Default: true */
  secure?: boolean;
  /** SameSite attribute. Default: 'Lax' */
  sameSite?: 'Strict' | 'Lax' | 'None';
}

// ─── Provider props ───────────────────────────────────────────────────────────

export interface AuthProviderProps {
  children: React.ReactNode;
  /** PocketBase base URL. Default: '' (uses Vite proxy). */
  baseUrl?: string;
  cookieOptions?: CookieAuthStoreOptions;
}
