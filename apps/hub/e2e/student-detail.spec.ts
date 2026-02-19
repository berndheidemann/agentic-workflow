import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3572';

/**
 * Schüler-Verwaltung E2E-Tests (REQ-025)
 *
 * Tests:
 * 1. Unauthentifizierter Zugriff wird zur Login-Seite umgeleitet
 * 2. Schüler-Detail-Route ist geschützt
 */
test.describe('Schüler-Verwaltung (unauthentifiziert)', () => {
  test('schützt /dashboard/klassen/:classId/schueler/:studentId — Redirect zur Login-Seite', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/klassen/some-class-id/schueler/some-student-id`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Anmelden', level: 1 })).toBeVisible();
  });

  test('schützt /dashboard/klassen/:classId/schueler/:studentId mit alternativem Pfad', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/klassen/abc123/schueler/xyz789`);
    await expect(page).toHaveURL(/\/login/);
  });
});
