// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseCard } from './course-card';
import type { SiteConfig } from '../config/sites';
import type { CourseProgressItem } from '../hooks/use-course-progress';

const mockSite: SiteConfig = {
  slug: 'ap1',
  name: 'AP1-Trainer',
  description: 'Abschlussprüfung Teil 1',
  icon: 'M11.35 3.836c-.065.21-.1.433-.1.664',
  basePath: '/ap1/',
  frameworkType: 'starlight',
  isActive: true,
  sortOrder: 1,
  totalExercises: 120,
  modules: [],
};

const mockProgress: CourseProgressItem = {
  courseSlug: 'ap1',
  completedExercises: 36,
  totalExercises: 120,
  percentage: 30,
};

describe('CourseCard', () => {
  it('rendert den Titel als h2', () => {
    render(<CourseCard site={mockSite} />);
    expect(screen.getByRole('heading', { name: 'AP1-Trainer', level: 2 })).toBeInTheDocument();
  });

  it('rendert die Beschreibung', () => {
    render(<CourseCard site={mockSite} />);
    expect(screen.getByText('Abschlussprüfung Teil 1')).toBeInTheDocument();
  });

  it('rendert ein SVG-Icon', () => {
    const { container } = render(<CourseCard site={mockSite} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('Link zeigt auf basePath', () => {
    render(<CourseCard site={mockSite} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/ap1/');
  });

  it('Link hat aria-label mit Name und Beschreibung', () => {
    render(<CourseCard site={mockSite} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', 'AP1-Trainer: Abschlussprüfung Teil 1');
  });

  it('zeigt keinen Fortschrittsbalken (Gast-Modus)', () => {
    const { container } = render(<CourseCard site={mockSite} />);
    expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument();
  });

  it('zeigt Fortschrittsbalken wenn progress-Prop vorhanden', () => {
    const { container } = render(<CourseCard site={mockSite} progress={mockProgress} />);
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('Fortschrittsbalken zeigt korrekten aria-valuenow', () => {
    const { container } = render(<CourseCard site={mockSite} progress={mockProgress} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute('aria-valuenow', '30');
  });

  it('zeigt Aufgaben-Text im Fortschrittsbalken', () => {
    render(<CourseCard site={mockSite} progress={mockProgress} />);
    expect(screen.getByText('36 von 120 Aufgaben')).toBeInTheDocument();
  });

  it('zeigt keinen Fortschrittsbalken wenn totalExercises = 0', () => {
    const progressZeroTotal: CourseProgressItem = { ...mockProgress, totalExercises: 0, percentage: 0 };
    const { container } = render(<CourseCard site={mockSite} progress={progressZeroTotal} />);
    expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument();
  });
});
