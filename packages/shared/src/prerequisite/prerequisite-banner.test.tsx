// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrerequisiteBanner } from './prerequisite-banner';
import type { PrerequisiteInfo } from './types';

function makePrereq(overrides: Partial<PrerequisiteInfo> = {}): PrerequisiteInfo {
  return {
    lessonPath: 'netzwerktechnik/ip-adressierung',
    displayName: 'IP-Adressierung',
    href: '/ap1/netzwerktechnik/ip-adressierung/',
    ...overrides,
  };
}

describe('PrerequisiteBanner', () => {
  it('renders nothing when unmet is empty', () => {
    const { container } = render(<PrerequisiteBanner unmet={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders yellow banner with one prerequisite', () => {
    render(<PrerequisiteBanner unmet={[makePrereq()]} />);

    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText(/Wir empfehlen zuerst/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'IP-Adressierung' })).toBeInTheDocument();
  });

  it('links to the correct href', () => {
    render(<PrerequisiteBanner unmet={[makePrereq()]} />);

    const link = screen.getByRole('link', { name: 'IP-Adressierung' });
    expect(link).toHaveAttribute('href', '/ap1/netzwerktechnik/ip-adressierung/');
  });

  it('renders multiple prerequisites as separate links', () => {
    const unmet = [
      makePrereq({ lessonPath: 'netzwerktechnik/ip-adressierung', displayName: 'IP-Adressierung', href: '/ap1/netzwerktechnik/ip-adressierung/' }),
      makePrereq({ lessonPath: 'netzwerktechnik/osi-modell', displayName: 'OSI-Modell', href: '/ap1/netzwerktechnik/osi-modell/' }),
    ];

    render(<PrerequisiteBanner unmet={unmet} />);

    expect(screen.getByRole('link', { name: 'IP-Adressierung' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'OSI-Modell' })).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<PrerequisiteBanner unmet={[makePrereq()]} />);

    const banner = screen.getByRole('note');
    expect(banner).toHaveAttribute('aria-label', 'Empfohlene Voraussetzungen');
  });

  it('applies custom className', () => {
    render(<PrerequisiteBanner unmet={[makePrereq()]} className="my-custom-class" />);

    const banner = screen.getByRole('note');
    expect(banner).toHaveClass('my-custom-class');
  });
});
