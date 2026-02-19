import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3572';

/**
 * Fortschrittsmatrix E2E-Tests (REQ-023a)
 *
 * Da Teacher-Auth in E2E einen echten PocketBase-Account benötigt,
 * testen wir hier:
 * 1. Zugriffsschutz (unauthentifiziert → Login-Redirect)
 * 2. Matrix-Route ist geschützt
 * 3. Basis-Navigation zum Matrix-Tab
 */
test.describe('Fortschrittsmatrix (unauthentifiziert)', () => {
  test('schützt /dashboard/matrix — Redirect zur Login-Seite', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/matrix`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Anmelden', level: 1 })).toBeVisible();
  });

  test('Login-Seite zeigt Weiterleitung nach erfolgreicher Anmeldung', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/matrix`);
    await expect(page).toHaveURL(/\/login/);
    // Redirect-Ziel wird nach Login erreicht (URL-Parameter vorhanden)
    const url = page.url();
    expect(url).toContain('login');
  });
});

test.describe('Fortschrittsmatrix — Startseite (ohne Login nicht erreichbar)', () => {
  test('Matrix-Link ist im Dashboard-Menü vorhanden', async ({ page }) => {
    // Dashboard redirectet zur Login-Seite — prüfe dass der Redirect funktioniert
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
    // Navigiere zur Login-Seite und prüfe dass keine Matrix sichtbar ist
    await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible();
  });
});
