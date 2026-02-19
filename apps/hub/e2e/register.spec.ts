import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3572';

test.describe('Registrierungs-Seite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
  });

  test('zeigt das Registrierungs-Formular', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Registrieren', level: 1 })).toBeVisible();
    await expect(page.getByLabel('Klassen-Code')).toBeVisible();
    await expect(page.getByLabel('Benutzername')).toBeVisible();
    await expect(page.getByLabel('PIN (4 Ziffern)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrieren' })).toBeVisible();
  });

  test('zeigt Validierungsfehler bei leerem Submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Registrieren' }).click();
    await expect(page.getByText('Bitte Klassen-Code eingeben.')).toBeVisible();
    await expect(page.getByText('Bitte Benutzernamen eingeben.')).toBeVisible();
    await expect(page.getByText('Bitte PIN eingeben.')).toBeVisible();
  });

  test('Klassen-Code wird automatisch großgeschrieben', async ({ page }) => {
    await page.getByLabel('Klassen-Code').fill('ab3c4d');
    await expect(page.getByLabel('Klassen-Code')).toHaveValue('AB3C4D');
  });

  test('zeigt Fehler bei zu kurzem Benutzernamen', async ({ page }) => {
    await page.getByLabel('Klassen-Code').fill('AB3C4D');
    await page.getByLabel('Benutzername').fill('ab');
    await page.getByLabel('PIN (4 Ziffern)').fill('1234');
    await page.getByRole('button', { name: 'Registrieren' }).click();
    await expect(page.getByText(/mindestens 3 Zeichen/)).toBeVisible();
  });

  test('zeigt Fehler bei ungültigem PIN', async ({ page }) => {
    await page.getByLabel('Klassen-Code').fill('AB3C4D');
    await page.getByLabel('Benutzername').fill('testuser');
    await page.getByLabel('PIN (4 Ziffern)').fill('12');
    await page.getByRole('button', { name: 'Registrieren' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /4 Ziffern/ })).toBeVisible();
  });

  test('Link zur Login-Seite vorhanden', async ({ page }) => {
    const link = page.getByRole('link', { name: /Anmelden/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/login');
  });

  test('Tab-Navigation durch alle Felder funktioniert', async ({ page }) => {
    const classCodeInput = page.getByLabel('Klassen-Code');
    const usernameInput = page.getByLabel('Benutzername');
    const pinInput = page.getByLabel('PIN (4 Ziffern)');
    const submitButton = page.getByRole('button', { name: 'Registrieren' });

    await classCodeInput.focus();
    await expect(classCodeInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(usernameInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(pinInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(submitButton).toBeFocused();
  });
});
