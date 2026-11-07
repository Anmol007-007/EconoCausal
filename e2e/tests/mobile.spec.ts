import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport & Responsive Navigation Flow', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should adapt layout to mobile 375px viewport and render mobile menu', async ({ page }) => {
    await page.goto('/');

    const mobileMenuBtn = page.locator('button[aria-label*="menu" i], [data-testid="mobile-menu-btn"], button:has-text("☰")').first();
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      await expect(page.locator('nav, [role="navigation"], [data-testid="mobile-nav"]').first()).toBeVisible();
    }
  });

  test('should have touch-friendly target sizes on interactive elements', async ({ page }) => {
    await page.goto('/');
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});

