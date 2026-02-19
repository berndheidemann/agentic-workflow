// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue, CourseUnlock } from '@lernplattform/shared';
import React from 'react';
import { useModuleUnlocks } from './use-module-unlocks';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockGetFullList = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

function makeAuthContext(): AuthContextValue {
  return {
    isLoggedIn: true,
    user: { id: 'teacher-1', username: 'lehrer', email: '', role: 'teacher', classId: null, displayName: '', verified: true },
    token: 'tok',
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    pb: {
      collection: () => ({
        getFullList: mockGetFullList,
        create: mockCreate,
        update: mockUpdate,
      }),
    } as unknown as AuthContextValue['pb'],
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(AuthContext.Provider, { value: makeAuthContext() }, children);
}

const MODULE_IDS = ['modul-1', 'modul-2', 'modul-3'];

function makeUnlockRecord(overrides: Partial<CourseUnlock> = {}): CourseUnlock {
  return {
    id: 'rec-1',
    class_id: 'cls-1',
    user_id: '',
    course: 'ap1',
    module: 'modul-1',
    is_unlocked: true,
    unlocked_by: 'teacher-1',
    unlocked_at: '',
    created: '',
    updated: '',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useModuleUnlocks', () => {
  beforeEach(() => {
    mockGetFullList.mockReset();
    mockCreate.mockReset();
    mockUpdate.mockReset();
  });

  it('returns empty modules when classId is null', () => {
    const { result } = renderHook(() => useModuleUnlocks(null, 'ap1', MODULE_IDS), { wrapper });
    expect(result.current.modules).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns empty modules when course is null', () => {
    const { result } = renderHook(() => useModuleUnlocks('cls-1', null, MODULE_IDS), { wrapper });
    expect(result.current.modules).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('default state: all modules unlocked when no records exist', async () => {
    mockGetFullList.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useModuleUnlocks('cls-1', 'ap1', MODULE_IDS), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.modules).toHaveLength(3);
    expect(result.current.modules.every((m) => m.status === 'unlocked')).toBe(true);
    expect(result.current.modules.every((m) => m.recordId === null)).toBe(true);
  });

  it('maps existing records to module states', async () => {
    mockGetFullList.mockResolvedValueOnce([
      makeUnlockRecord({ id: 'r1', module: 'modul-1', is_unlocked: true }),
      makeUnlockRecord({ id: 'r2', module: 'modul-2', is_unlocked: false }),
    ]);

    const { result } = renderHook(() => useModuleUnlocks('cls-1', 'ap1', MODULE_IDS), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.modules[0]).toEqual({ moduleId: 'modul-1', status: 'unlocked', recordId: 'r1' });
    expect(result.current.modules[1]).toEqual({ moduleId: 'modul-2', status: 'locked', recordId: 'r2' });
    expect(result.current.modules[2]).toEqual({ moduleId: 'modul-3', status: 'unlocked', recordId: null });
  });

  it('sets error on API failure', async () => {
    mockGetFullList.mockRejectedValueOnce(new Error('Netzwerkfehler'));

    const { result } = renderHook(() => useModuleUnlocks('cls-1', 'ap1', MODULE_IDS), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toContain('Netzwerkfehler');
  });

  it('toggleModule creates missing records and toggles', async () => {
    mockGetFullList.mockResolvedValueOnce([
      makeUnlockRecord({ id: 'r1', module: 'modul-1', is_unlocked: true }),
    ]);

    // When toggling modul-1 (unlocked → locked), ensureAllRecords creates missing records first
    mockCreate.mockImplementation(async (data: Record<string, unknown>) => ({
      ...makeUnlockRecord({ module: data.module as string, is_unlocked: data.is_unlocked as boolean }),
      id: `new-${data.module}`,
    }));
    mockUpdate.mockImplementation(async (id: string) => ({
      ...makeUnlockRecord({ id, module: 'modul-1', is_unlocked: false }),
    }));

    const { result } = renderHook(() => useModuleUnlocks('cls-1', 'ap1', MODULE_IDS), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleModule('modul-1');
    });

    // Should have created missing records (modul-2, modul-3) and updated modul-1
    expect(mockCreate).toHaveBeenCalledTimes(2); // modul-2, modul-3
    expect(mockUpdate).toHaveBeenCalledWith('r1', { is_unlocked: false });
  });

  it('unlockUpTo unlocks modules up to index and locks the rest', async () => {
    const records = [
      makeUnlockRecord({ id: 'r1', module: 'modul-1', is_unlocked: false }),
      makeUnlockRecord({ id: 'r2', module: 'modul-2', is_unlocked: false }),
      makeUnlockRecord({ id: 'r3', module: 'modul-3', is_unlocked: false }),
    ];
    mockGetFullList.mockResolvedValueOnce(records);
    mockCreate.mockImplementation(async () => ({}));
    mockUpdate.mockImplementation(async (id: string, data: Record<string, unknown>) => ({
      ...records.find((r) => r.id === id),
      ...data,
    }));

    const { result } = renderHook(() => useModuleUnlocks('cls-1', 'ap1', MODULE_IDS), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.unlockUpTo('modul-2', MODULE_IDS);
    });

    // modul-1 and modul-2 should be unlocked, modul-3 stays locked
    expect(mockUpdate).toHaveBeenCalledWith('r1', { is_unlocked: true });
    expect(mockUpdate).toHaveBeenCalledWith('r2', { is_unlocked: true });
    // modul-3 is already locked, so no update needed
    expect(mockUpdate).not.toHaveBeenCalledWith('r3', expect.anything());
  });
});
