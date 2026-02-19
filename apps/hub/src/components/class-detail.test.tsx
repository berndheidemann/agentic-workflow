import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue } from '@lernplattform/shared';
import type { Class, User } from '@lernplattform/shared';
import { ClassDetail } from './class-detail';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

const mockStudents: User[] = [
  { id: 'u-1', username: 'anna', email: '', emailVisibility: false, verified: false, role: 'student', class_id: 'cls-1', display_name: 'Anna Müller', created: '', updated: '' },
  { id: 'u-2', username: 'bernd', email: '', emailVisibility: false, verified: false, role: 'student', class_id: 'cls-1', display_name: '', created: '', updated: '' },
];

const mockGetOne = vi.fn();
const mockGetFullList = vi.fn();

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
      collection: () => ({ getOne: mockGetOne, getFullList: mockGetFullList }),
    } as unknown as AuthContextValue['pb'],
  };
}

function renderDetail(classId = 'cls-1', onBack = vi.fn()) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={makeAuthContext()}>
        <ClassDetail classId={classId} onBack={onBack} />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ClassDetail', () => {
  beforeEach(() => {
    mockGetOne.mockReset();
    mockGetFullList.mockReset();
  });

  it('zeigt Klassenname und Schuljahr nach dem Laden', async () => {
    mockGetOne.mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValueOnce(mockStudents);

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('FI24a')).toBeInTheDocument();
      expect(screen.getByText('2025/2026')).toBeInTheDocument();
    });
  });

  it('zeigt Klassen-Code prominent', async () => {
    mockGetOne.mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValueOnce(mockStudents);

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('ABCDEF')).toBeInTheDocument();
    });
  });

  it('zeigt Schüler-Liste', async () => {
    mockGetOne.mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValueOnce(mockStudents);

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('anna')).toBeInTheDocument();
      expect(screen.getByText('bernd')).toBeInTheDocument();
    });
  });

  it('zeigt Display-Name oder Dash für leeren Display-Name', async () => {
    mockGetOne.mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValueOnce(mockStudents);

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Anna Müller')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('zeigt Empty-State wenn keine Schüler vorhanden', async () => {
    mockGetOne.mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValueOnce([]);

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText(/Noch keine Schüler in dieser Klasse/i)).toBeInTheDocument();
    });
  });

  it('zeigt Lade-Indikator initial', () => {
    mockGetOne.mockImplementation(() => new Promise(() => {}));
    mockGetFullList.mockImplementation(() => new Promise(() => {}));

    renderDetail();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('zeigt Fehlermeldung bei API-Fehler', async () => {
    mockGetOne.mockRejectedValueOnce(new Error('Network error'));
    mockGetFullList.mockRejectedValueOnce(new Error('Network error'));

    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/konnte nicht geladen werden/i)).toBeInTheDocument();
    });
  });

  it('ruft onBack beim Zurück-Button auf', async () => {
    mockGetOne.mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValueOnce([]);

    const onBack = vi.fn();
    renderDetail('cls-1', onBack);

    await waitFor(() => screen.getByText('FI24a'));
    fireEvent.click(screen.getByRole('button', { name: /Zurück/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('zeigt klickbare Schüler-Zeilen wenn onSelectStudent übergeben wird', async () => {
    mockGetOne.mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValueOnce(mockStudents);

    const onSelectStudent = vi.fn();
    render(
      <MemoryRouter>
        <AuthContext.Provider value={makeAuthContext()}>
          <ClassDetail classId="cls-1" onBack={vi.fn()} onSelectStudent={onSelectStudent} />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('anna'));
    const studentBtn = screen.getByRole('button', { name: /Schüler anna öffnen/i });
    expect(studentBtn).toBeInTheDocument();
  });

  it('ruft onSelectStudent mit Schüler-ID auf bei Klick', async () => {
    mockGetOne.mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValueOnce(mockStudents);

    const onSelectStudent = vi.fn();
    render(
      <MemoryRouter>
        <AuthContext.Provider value={makeAuthContext()}>
          <ClassDetail classId="cls-1" onBack={vi.fn()} onSelectStudent={onSelectStudent} />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('anna'));
    fireEvent.click(screen.getByRole('button', { name: /Schüler anna öffnen/i }));
    expect(onSelectStudent).toHaveBeenCalledWith('u-1');
  });

  it('hat Copy-Button für den Klassen-Code', async () => {
    mockGetOne.mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValueOnce([]);

    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Code kopieren/i })).toBeInTheDocument();
    });
  });

  it('Copy-Button ruft clipboard.writeText auf', async () => {
    mockGetOne.mockResolvedValueOnce(mockClass);
    mockGetFullList.mockResolvedValueOnce([]);

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderDetail();
    await waitFor(() => screen.getByRole('button', { name: /Code kopieren/i }));
    fireEvent.click(screen.getByRole('button', { name: /Code kopieren/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('ABCDEF');
    });
  });
});
