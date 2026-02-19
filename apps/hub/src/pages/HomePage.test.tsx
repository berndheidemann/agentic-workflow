import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('HomePage', () => {
  it('zeigt die Hauptüberschrift', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByRole('heading', { name: 'Lernplattform', level: 1 })).toBeInTheDocument();
  });

  it('zeigt alle 6 Kurs-Kacheln als Links', () => {
    renderWithRouter(<HomePage />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(6);
  });

  it('verlinkt AP1-Trainer korrekt', () => {
    renderWithRouter(<HomePage />);
    const link = screen.getByRole('link', { name: /AP1-Trainer/i });
    expect(link).toHaveAttribute('href', '/ap1/');
  });

  it('verlinkt Pandas korrekt', () => {
    renderWithRouter(<HomePage />);
    const link = screen.getByRole('link', { name: /Pandas/i });
    expect(link).toHaveAttribute('href', '/pandas/');
  });

  it('hat einen main-Bereich', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
