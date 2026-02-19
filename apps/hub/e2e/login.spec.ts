import { test, expect } from '@playwright/test';

// These E2E tests require the dev server running on port 3572.
// Run with: npm run dev -- --port 3572
// or: npx playwright test (with configured baseURL)

const BASE_URL = 'http://localhost:3572';

test.describe('Login-Seite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
  });

  test('zeigt das Login-Formular', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Anmelden', level: 1 })).toBeVisible();
    await expect(page.getByLabel('Klassen-Code')).toBeVisible();
    await expect(page.getByLabel('Benutzername')).toBeVisible();
    await expect(page.getByLabel('PIN (4 Ziffern)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
  });

  test('zeigt Validierungsfehler bei leerem Submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await expect(page.getByText('Bitte Klassen-Code eingeben.')).toBeVisible();
    await expect(page.getByText('Bitte Benutzernamen eingeben.')).toBeVisible();
    await expect(page.getByText('Bitte PIN eingeben.')).toBeVisible();
  });

  test('Klassen-Code wird automatisch großgeschrieben', async ({ page }) => {
    await page.getByLabel('Klassen-Code').fill('ab3c4d');
    await expect(page.getByLabel('Klassen-Code')).toHaveValue('AB3C4D');
  });

  test('Link zur Registrierungsseite vorhanden', async ({ page }) => {
    const link = page.getByRole('link', { name: /registrieren/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/register');
  });

  test('Tab-Navigation durch alle Felder funktioniert', async ({ page }) => {
    const classCodeInput = page.getByLabel('Klassen-Code');
    const usernameInput = page.getByLabel('Benutzername');
    const pinInput = page.getByLabel('PIN (4 Ziffern)');
    const submitButton = page.getByRole('button', { name: 'Anmelden' });

    await classCodeInput.focus();
    await expect(classCodeInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(usernameInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(pinInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(submitButton).toBeFocused();
  });

  test('Login mit falschen Daten zeigt Fehlermeldung', async ({ page }) => {
    await page.getByLabel('Klassen-Code').fill('AB3C4D');
    await page.getByLabel('Benutzername').fill('nichtexistierend');
    await page.getByLabel('PIN (4 Ziffern)').fill('9999');
    await page.getByRole('button', { name: 'Anmelden' }).click();

    // Either authentication error or network error should be shown
    const errorMessage = page.getByRole('alert');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });
});
