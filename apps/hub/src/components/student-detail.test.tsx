// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue, User, Class } from '@lernplattform/shared';
import { StudentDetail } from './student-detail';

// jsdom does not implement HTMLDialogElement.showModal/close natively.
// We also set/remove the 'open' attribute so dialog content becomes accessible.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

afterEach(() => {
  cleanup();
});

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const mockStudent: User = {
  id: 'student-1',
  username: 'max.mustermann',
  email: '',
  emailVisibility: false,
  verified: false,
  role: 'student',
  class_id: 'cls-1',
  display_name: 'Max Mustermann',
  created: '',
  updated: '',
};

const mockClass: Class = {
  id: 'cls-1',
  name: 'FI24a',
  join_code: 'ABCDEF',
  school_year: '2025/2026',
  is_active: true,
  created_by: 'teacher-1',
  created: '',
  updated: '',
};

// ─── Auth Context Mock ─────────────────────────────────────────────────────────

const mockGetOne = vi.fn();
const mockGetFullList = vi.fn();
const mockUpdate = vi.fn();

function makeAuthContext(): AuthContextValue {
  return {
    isLoggedIn: true,
    user: {
      id: 'teacher-1',
      username: 'lehrer',
      email: '',
      role: 'teacher',
      classId: null,
      displayName: '',
      verified: true,
    },
    token: 'tok',
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    pb: {
      collection: () => ({
        getOne: mockGetOne,
        getFullList: mockGetFullList,
        update: mockUpdate,
      }),
    } as unknown as AuthContextValue['pb'],
  };
}

function renderStudentDetail(studentId = 'student-1', classId = 'cls-1', onBack = vi.fn()) {
  return render(
    <AuthContext.Provider value={makeAuthContext()}>
      <StudentDetail studentId={studentId} classId={classId} onBack={onBack} />
    </AuthContext.Provider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StudentDetail', () => {
  beforeEach(() => {
    mockGetOne.mockReset();
    mockGetFullList.mockReset();
    mockUpdate.mockReset();
  });

  it('shows loading indicator initially', () => {
    mockGetOne.mockImplementation(() => new Promise(() => {}));
    mockGetFullList.mockImplementation(() => new Promise(() => {}));

    renderStudentDetail();
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('shows student username after loading', async () => {
    mockGetOne.mockResolvedValueOnce(mockStudent).mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValue([]);

    renderStudentDetail();
    await waitFor(() => expect(screen.getByText('max.mustermann')).toBeDefined());
  });

  it('shows class name after loading', async () => {
    mockGetOne.mockResolvedValueOnce(mockStudent).mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValue([]);

    renderStudentDetail();
    await waitFor(() => expect(screen.getByText(/FI24a/)).toBeDefined());
  });

  it('shows display name when present', async () => {
    mockGetOne.mockResolvedValueOnce(mockStudent).mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValue([]);

    renderStudentDetail();
    await waitFor(() => expect(screen.getByText('Max Mustermann')).toBeDefined());
  });

  it('shows course progress bars', async () => {
    mockGetOne.mockResolvedValueOnce(mockStudent).mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValue([
      { course: 'ap1', lesson: 'l1' },
      { course: 'ap1', lesson: 'l2' },
    ]);

    renderStudentDetail();
    await waitFor(() => {
      const progressbars = screen.getAllByRole('progressbar');
      expect(progressbars.length).toBeGreaterThan(0);
    });
  });

  it('PIN reset button opens dialog', async () => {
    mockGetOne.mockResolvedValueOnce(mockStudent).mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValue([]);

    renderStudentDetail();
    await waitFor(() => screen.getByText('max.mustermann'));

    const resetBtn = screen.getByRole('button', { name: /PIN zurücksetzen/i });
    expect(resetBtn).toBeDefined();
    fireEvent.click(resetBtn);

    await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined());
  });

  it('PIN reset calls pb.update with new PIN', async () => {
    mockGetOne.mockResolvedValueOnce(mockStudent).mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValue([]);
    mockUpdate.mockResolvedValue({});

    renderStudentDetail();
    await waitFor(() => screen.getByText('max.mustermann'));

    // Open dialog
    fireEvent.click(screen.getByRole('button', { name: /PIN zurücksetzen/i }));

    // Change PIN
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1234' } });

    // Confirm
    fireEvent.click(screen.getByRole('button', { name: /PIN setzen/ }));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith(
      'student-1',
      { password: '1234', passwordConfirm: '1234' }
    ));
  });

  it('back button calls onBack', async () => {
    mockGetOne.mockResolvedValueOnce(mockStudent).mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValue([]);

    const onBack = vi.fn();
    renderStudentDetail('student-1', 'cls-1', onBack);

    await waitFor(() => screen.getByText('max.mustermann'));
    fireEvent.click(screen.getByRole('button', { name: /Zurück zur Klassen-Übersicht/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows error when loading fails', async () => {
    mockGetOne.mockRejectedValue(new Error('Netzwerkfehler'));
    mockGetFullList.mockResolvedValue([]);

    renderStudentDetail();
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toMatch(/konnten nicht geladen werden/);
    });
  });
});
