import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

function renderDashboard(path = '/klassen') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  it('zeigt Lehrer-Dashboard Überschrift', () => {
    renderDashboard();
    expect(
      screen.getByRole('heading', { name: 'Lehrer-Dashboard', level: 1 })
    ).toBeInTheDocument();
  });

  it('zeigt Dashboard-Navigation', () => {
    renderDashboard();
    const nav = screen.getByRole('navigation', { name: 'Dashboard-Navigation' });
    expect(nav).toBeInTheDocument();
  });

  it('zeigt Klassen-Link in Navigation', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: 'Klassen' })).toBeInTheDocument();
  });

  it('zeigt Matrix-Link in Navigation', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: 'Matrix' })).toBeInTheDocument();
  });

  it('zeigt Freischaltung-Link in Navigation', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: 'Freischaltung' })).toBeInTheDocument();
  });

  it('zeigt Klassen-Ansicht als Standard-Inhalt', () => {
    renderDashboard('/klassen');
    expect(screen.getByRole('heading', { name: 'Klassen', level: 2 })).toBeInTheDocument();
  });

  it('hat ein main-Element für den Hauptinhalt', () => {
    renderDashboard();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
