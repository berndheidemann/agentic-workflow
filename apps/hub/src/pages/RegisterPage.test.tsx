import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('RegisterPage', () => {
  it('zeigt die Registrierungs-Überschrift', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByRole('heading', { name: 'Registrieren', level: 1 })).toBeInTheDocument();
  });

  it('enthält Link zur Login-Seite', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByRole('link', { name: /Anmelden/i })).toBeInTheDocument();
  });

  it('hat einen main-Bereich', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
