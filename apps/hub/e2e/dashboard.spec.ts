import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3572';

test.describe('Dashboard (unauthentifiziert)', () => {
  test('leitet auf Login-Seite um', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Anmelden', level: 1 })).toBeVisible();
  });

  test('leitet auch bei Dashboard-Unterseiten um', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/klassen`);
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('404-Seite', () => {
  test('zeigt 404 für unbekannte Routen', async ({ page }) => {
    await page.goto(`${BASE_URL}/diese-seite-gibt-es-nicht`);
    await expect(page.getByRole('heading', { name: '404', level: 1 })).toBeVisible();
    await expect(page.getByText('Seite nicht gefunden')).toBeVisible();
  });

  test('hat Link zur Startseite', async ({ page }) => {
    await page.goto(`${BASE_URL}/nicht-vorhanden`);
    const link = page.getByRole('link', { name: 'Zur Startseite' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/');
  });

  test('Link zur Startseite funktioniert', async ({ page }) => {
    await page.goto(`${BASE_URL}/nicht-vorhanden`);
    await page.getByRole('link', { name: 'Zur Startseite' }).click();
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.getByRole('heading', { name: 'Lernplattform', level: 1 })).toBeVisible();
  });
});
