// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginBanner } from './login-banner';

// ─── Mock useAuth ──────────────────────────────────────────────────────────────
// Mock only the external hook dependency — LoginBanner itself is tested real.

vi.mock('./use-auth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from './use-auth';
const mockUseAuth = vi.mocked(useAuth);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginBanner', () => {
  it('renders banner when user is not logged in', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false } as ReturnType<typeof useAuth>);
    render(<LoginBanner />);
    expect(screen.getByRole('complementary', { name: 'Anmelde-Hinweis' })).toBeInTheDocument();
    expect(screen.getByText(/Melde dich an/i)).toBeInTheDocument();
    expect(screen.getByText(/deinen Fortschritt zu speichern/i)).toBeInTheDocument();
  });

  it('renders link to /login by default', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false } as ReturnType<typeof useAuth>);
    render(<LoginBanner />);
    const link = screen.getByRole('link', { name: /Melde dich an/i });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('renders link to custom loginHref when provided', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false } as ReturnType<typeof useAuth>);
    render(<LoginBanner loginHref="https://learn.szut.dev/login" />);
    const link = screen.getByRole('link', { name: /Melde dich an/i });
    expect(link).toHaveAttribute('href', 'https://learn.szut.dev/login');
  });

  it('is not visible when user is logged in', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: true } as ReturnType<typeof useAuth>);
    const { container } = render(<LoginBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disappears when close button is clicked', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false } as ReturnType<typeof useAuth>);
    render(<LoginBanner />);

    const closeButton = screen.getByRole('button', { name: 'Hinweis schließen' });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);

    expect(screen.queryByRole('complementary', { name: 'Anmelde-Hinweis' })).not.toBeInTheDocument();
  });

  it('close button has accessible aria-label', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false } as ReturnType<typeof useAuth>);
    render(<LoginBanner />);
    expect(screen.getByRole('button', { name: 'Hinweis schließen' })).toBeInTheDocument();
  });

  it('decorative icon has aria-hidden', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false } as ReturnType<typeof useAuth>);
    render(<LoginBanner />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
