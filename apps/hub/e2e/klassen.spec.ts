import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3572';

/**
 * Klassen-Verwaltung E2E-Tests (REQ-021)
 *
 * Da Teacher-Auth in E2E einen echten PocketBase-Account benötigt,
 * testen wir hier:
 * 1. Schutzmechanismus (unauthentifiziert → Login-Redirect)
 * 2. Korrekte Unterseiten-Routen werden geschützt
 * 3. Login-Seite zeigt korrekten Kontext
 */
test.describe('Klassen-Verwaltung (unauthentifiziert)', () => {
  test('schützt /dashboard/klassen — Redirect zur Login-Seite', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/klassen`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Anmelden', level: 1 })).toBeVisible();
  });

  test('schützt /dashboard/klassen/:id — Redirect zur Login-Seite', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/klassen/some-class-id`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Anmelden', level: 1 })).toBeVisible();
  });

  test('schützt /dashboard/matrix — Redirect zur Login-Seite', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/matrix`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('schützt /dashboard/freischaltung — Redirect zur Login-Seite', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/freischaltung`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('Login-Seite hat Registrierungs-Link', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/klassen`);
    await expect(page).toHaveURL(/\/login/);
    const registerLink = page.getByRole('link', { name: /Jetzt registrieren/i });
    await expect(registerLink).toBeVisible();
  });
});
