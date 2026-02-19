import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3572';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('zeigt die Hauptüberschrift', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Lernplattform', level: 1 })).toBeVisible();
    await expect(page.getByText('Deine zentrale Plattform für IT-Berufe')).toBeVisible();
  });

  test('zeigt alle 6 Kurs-Kacheln', async ({ page }) => {
    const tiles = page.getByRole('link').filter({ has: page.getByRole('heading', { level: 2 }) });
    await expect(tiles).toHaveCount(6);
  });

  test('Kacheln haben korrekte Titel und Links', async ({ page }) => {
    const expected = [
      { name: 'AP1-Trainer', href: '/ap1/' },
      { name: 'Pandas', href: '/pandas/' },
      { name: 'REST & NoSQL', href: '/rest/' },
      { name: 'World of Zuul', href: '/zuul/' },
      { name: 'NumPy', href: '/numpy/' },
      { name: 'UML', href: '/uml/' },
    ];

    for (const { name, href } of expected) {
      const link = page.getByRole('link', { name: new RegExp(name) });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', href);
    }
  });

  test('zeigt Beschreibungen für jede Kachel', async ({ page }) => {
    await expect(page.getByText('Abschlussprüfung Teil 1')).toBeVisible();
    await expect(page.getByText('Datenanalyse mit Python')).toBeVisible();
    await expect(page.getByText('Web-APIs und Datenbanken')).toBeVisible();
    await expect(page.getByText('Objektorientierte Programmierung')).toBeVisible();
    await expect(page.getByText('Numerik mit Python')).toBeVisible();
    await expect(page.getByText('Softwaremodellierung')).toBeVisible();
  });

  test('hat einen main-Bereich', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('responsives Layout: 1 Spalte auf Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    // All tiles should still be visible (stacked)
    const tiles = page.getByRole('link').filter({ has: page.getByRole('heading', { level: 2 }) });
    await expect(tiles).toHaveCount(6);
  });
});
