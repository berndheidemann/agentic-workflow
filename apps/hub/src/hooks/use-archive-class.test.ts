import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useArchiveClass } from './use-archive-class';
import type { AuthContextValue } from '@lernplattform/shared';
import { AuthContext } from '@lernplattform/shared';
import React from 'react';

// ─── Mock pb.send ─────────────────────────────────────────────────────────────

const mockSend = vi.fn();

function makeWrapper() {
  const ctx: AuthContextValue = {
    isLoggedIn: true,
    user: { id: 'teacher-1', username: 'lehrer', email: '', role: 'teacher', classId: null, displayName: '', verified: true },
    token: 'tok',
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    pb: { send: mockSend } as unknown as AuthContextValue['pb'],
  };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(AuthContext.Provider, { value: ctx }, children);
  }
  return Wrapper;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useArchiveClass', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('sendet POST an /api/classes/:classId/archive', async () => {
    mockSend.mockResolvedValueOnce({ archived: true, deletedStudents: 5 });

    const { result } = renderHook(() => useArchiveClass(), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.archiveClass('cls-1');
    });

    expect(mockSend).toHaveBeenCalledWith('/api/classes/cls-1/archive', { method: 'POST' });
  });

  it('setzt isArchiving auf true während des Calls', async () => {
    let resolvePromise: (val: unknown) => void;
    mockSend.mockReturnValueOnce(new Promise((res) => { resolvePromise = res; }));

    const { result } = renderHook(() => useArchiveClass(), { wrapper: makeWrapper() });

    let archivePromise: Promise<unknown>;
    act(() => {
      archivePromise = result.current.archiveClass('cls-1');
    });

    expect(result.current.isArchiving).toBe(true);

    await act(async () => {
      resolvePromise!({ archived: true, deletedStudents: 3 });
      await archivePromise;
    });

    expect(result.current.isArchiving).toBe(false);
  });

  it('gibt ArchiveResult zurück bei Erfolg', async () => {
    mockSend.mockResolvedValueOnce({ archived: true, deletedStudents: 7 });

    const { result } = renderHook(() => useArchiveClass(), { wrapper: makeWrapper() });

    let archiveResult: unknown;
    await act(async () => {
      archiveResult = await result.current.archiveClass('cls-2');
    });

    expect(archiveResult).toEqual({ archived: true, deletedStudents: 7 });
    expect(result.current.error).toBeNull();
  });

  it('setzt error bei Netzwerkfehler', async () => {
    mockSend.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useArchiveClass(), { wrapper: makeWrapper() });

    await act(async () => {
      try {
        await result.current.archiveClass('cls-3');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Network error');
  });

  it('setzt isArchiving nach Fehler zurück auf false', async () => {
    mockSend.mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useArchiveClass(), { wrapper: makeWrapper() });

    await act(async () => {
      try {
        await result.current.archiveClass('cls-4');
      } catch {
        // expected
      }
    });

    expect(result.current.isArchiving).toBe(false);
  });
});
