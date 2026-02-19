// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './progress-bar';

describe('ProgressBar', () => {
  it('rendert role="progressbar" mit korrekten aria-Attributen', () => {
    const { container } = render(
      <ProgressBar percentage={50} completedCount={5} totalCount={10} courseSlug="ap1" />
    );
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('aria-label enthält Prozent und Zahlenwerte', () => {
    const { container } = render(
      <ProgressBar percentage={30} completedCount={3} totalCount={10} courseSlug="pandas" />
    );
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute('aria-label', expect.stringContaining('3 von 10'));
    expect(bar).toHaveAttribute('aria-label', expect.stringContaining('30%'));
    expect(bar).toHaveAttribute('aria-label', expect.stringContaining('pandas'));
  });

  it('zeigt Text "X von Y Aufgaben"', () => {
    render(<ProgressBar percentage={20} completedCount={4} totalCount={20} courseSlug="rest" />);
    expect(screen.getByText('4 von 20 Aufgaben')).toBeInTheDocument();
  });

  it('bei 0%: Balken hat width 0%', () => {
    const { container } = render(
      <ProgressBar percentage={0} completedCount={0} totalCount={10} courseSlug="zuul" />
    );
    const innerBar = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(innerBar.style.width).toBe('0%');
  });

  it('bei 50%: Balken hat width 50% und blauen Hintergrund', () => {
    const { container } = render(
      <ProgressBar percentage={50} completedCount={5} totalCount={10} courseSlug="numpy" />
    );
    const innerBar = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(innerBar.style.width).toBe('50%');
    expect(innerBar.className).toContain('bg-blue-500');
  });

  it('bei 100%: Balken hat width 100% und grünen Hintergrund', () => {
    const { container } = render(
      <ProgressBar percentage={100} completedCount={10} totalCount={10} courseSlug="uml" />
    );
    const innerBar = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(innerBar.style.width).toBe('100%');
    expect(innerBar.className).toContain('bg-green-500');
  });

  it('Prozent wird auf max 100 geclampt', () => {
    const { container } = render(
      <ProgressBar percentage={150} completedCount={15} totalCount={10} courseSlug="ap1" />
    );
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });

  it('Prozent wird auf min 0 geclampt', () => {
    const { container } = render(
      <ProgressBar percentage={-5} completedCount={0} totalCount={10} courseSlug="ap1" />
    );
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });
});
