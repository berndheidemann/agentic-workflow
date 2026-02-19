// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SidebarUnlock } from './sidebar-unlock';

describe('SidebarUnlock', () => {
  describe('status: unlocked', () => {
    it('renders nothing when status is unlocked', () => {
      const { container } = render(<SidebarUnlock status="unlocked" label="IT-Sicherheit" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('status: completed', () => {
    it('renders a checkmark icon when status is completed', () => {
      render(<SidebarUnlock status="completed" label="IT-Sicherheit" />);
      const icon = screen.getByRole('img');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-label', 'IT-Sicherheit abgeschlossen');
    });

    it('has correct title attribute for completed status', () => {
      render(<SidebarUnlock status="completed" label="Netzwerktechnik" />);
      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('title', 'Netzwerktechnik abgeschlossen');
    });

    it('applies sidebar-unlock-completed class for completed status', () => {
      render(<SidebarUnlock status="completed" label="IT-Sicherheit" />);
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('sidebar-unlock-completed');
    });

    it('applies custom className when provided', () => {
      render(<SidebarUnlock status="completed" label="IT-Sicherheit" className="my-custom" />);
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('sidebar-unlock-completed', 'my-custom');
    });
  });

  describe('status: locked', () => {
    it('renders a lock icon when status is locked', () => {
      render(<SidebarUnlock status="locked" label="Datenbanken" />);
      const btn = screen.getByRole('button');
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute('aria-label', 'Datenbanken ist gesperrt');
    });

    it('has correct title attribute for locked status', () => {
      render(<SidebarUnlock status="locked" label="Wirtschaft" />);
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('title', 'Wirtschaft ist gesperrt');
    });

    it('is keyboard focusable (tabIndex=0)', () => {
      render(<SidebarUnlock status="locked" label="Datenbanken" />);
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('tabindex', '0');
    });

    it('calls onLockedClick when clicked', () => {
      const onLockedClick = vi.fn();
      render(<SidebarUnlock status="locked" label="Datenbanken" onLockedClick={onLockedClick} />);
      const btn = screen.getByRole('button');
      fireEvent.click(btn);
      expect(onLockedClick).toHaveBeenCalledTimes(1);
    });

    it('calls onLockedClick when Enter key is pressed', () => {
      const onLockedClick = vi.fn();
      render(<SidebarUnlock status="locked" label="Datenbanken" onLockedClick={onLockedClick} />);
      const btn = screen.getByRole('button');
      fireEvent.keyDown(btn, { key: 'Enter' });
      expect(onLockedClick).toHaveBeenCalledTimes(1);
    });

    it('calls onLockedClick when Space key is pressed', () => {
      const onLockedClick = vi.fn();
      render(<SidebarUnlock status="locked" label="Datenbanken" onLockedClick={onLockedClick} />);
      const btn = screen.getByRole('button');
      fireEvent.keyDown(btn, { key: ' ' });
      expect(onLockedClick).toHaveBeenCalledTimes(1);
    });

    it('shows inline hint on click when no onLockedClick provided', () => {
      render(<SidebarUnlock status="locked" label="Datenbanken" />);
      const btn = screen.getByRole('button');
      expect(screen.queryByRole('tooltip')).toBeNull();
      fireEvent.click(btn);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Dieses Modul wurde noch nicht freigeschaltet.'
      );
    });

    it('toggles hint visibility on repeated clicks', () => {
      render(<SidebarUnlock status="locked" label="Datenbanken" />);
      const btn = screen.getByRole('button');
      fireEvent.click(btn);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      fireEvent.click(btn);
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('does NOT show inline hint when onLockedClick is provided', () => {
      const onLockedClick = vi.fn();
      render(<SidebarUnlock status="locked" label="Datenbanken" onLockedClick={onLockedClick} />);
      const btn = screen.getByRole('button');
      fireEvent.click(btn);
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('applies sidebar-unlock-locked class for locked status', () => {
      render(<SidebarUnlock status="locked" label="Datenbanken" />);
      const btn = screen.getByRole('button');
      expect(btn).toHaveClass('sidebar-unlock-locked');
    });

    it('applies custom className when provided for locked status', () => {
      render(<SidebarUnlock status="locked" label="Datenbanken" className="custom-cls" />);
      const btn = screen.getByRole('button');
      expect(btn).toHaveClass('sidebar-unlock-locked', 'custom-cls');
    });
  });
});
