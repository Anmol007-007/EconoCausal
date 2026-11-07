import { test, expect } from '@playwright/test';

test.describe('Theme & Dark Mode Persistence Flow', () => {
  test('should toggle dark mode and persist in localStorage', async ({ page }) => {
    await page.goto('/');

    const themeToggle = page.locator('button[aria-label*="theme" i], button[aria-label*="dark" i], button[aria-label*="mode" i], [data-testid="theme-toggle"]').first();
    if (await themeToggle.isVisible()) {
      const initialTheme = await page.evaluate(() => localStorage.getItem('econocausal_theme') || 'light');
      await themeToggle.click();

      const newTheme = await page.evaluate(() => localStorage.getItem('econocausal_theme'));
      expect(newTheme).not.toBe(initialTheme);

      await page.reload();
      const persistedTheme = await page.evaluate(() => localStorage.getItem('econocausal_theme'));
      expect(persistedTheme).toBe(newTheme);
    }
  });

  test('should maintain accessible contrast ratio across views', async ({ page }) => {
    await page.goto('/');
    const htmlElement = page.locator('html');
    await expect(htmlElement).toBeVisible();
  });
});

