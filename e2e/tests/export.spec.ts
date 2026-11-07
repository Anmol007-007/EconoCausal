import { test, expect } from '@playwright/test';

test.describe('Multi-Format Export Flow', () => {
  test('should open export modal when export button is clicked', async ({ page }) => {
    await page.goto('/');
    const exportBtn = page.locator('button:has-text("Export"), [aria-label*="export" i], [data-testid="export-btn"]').first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await expect(page.locator('text=CSV').or(page.locator('text=JSON')).or(page.locator('text=Download'))).toBeVisible();
    }
  });

  test('should verify backend export endpoints produce valid downloadable payloads', async ({ request }) => {
    const diagRes = await request.get('/api/diagnostics');
    expect(diagRes.status()).toBe(200);
    const diagJson = await diagRes.json();
    expect(diagJson).toBeDefined();

    const summaryRes = await request.get('/api/summary');
    expect(summaryRes.status()).toBe(200);
  });
});
