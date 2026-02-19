import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('LoginPage', () => {
  it('zeigt die Login-Überschrift', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Anmelden', level: 1 })).toBeInTheDocument();
  });

  it('enthält Link zur Registrierungsseite', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByRole('link', { name: /registrieren/i })).toBeInTheDocument();
  });

  it('hat einen main-Bereich', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
