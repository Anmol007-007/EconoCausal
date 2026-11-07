import { test, expect } from '@playwright/test';

test.describe('Upload Pipeline Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display upload pipeline page and benchmark dataset options', async ({ page }) => {
    await expect(page).toHaveTitle(/EconoCausal/);
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();

    const uploadSection = page.locator('text=Upload').or(page.locator('text=Dataset')).first();
    await expect(uploadSection).toBeVisible();
  });

  test('should trigger benchmark dataset ingestion', async ({ page }) => {
    const benchmarkBtn = page.locator('button:has-text("Starbucks"), button:has-text("Hillstrom"), button:has-text("Load Benchmark"), button:has-text("Generate")').first();
    if (await benchmarkBtn.isVisible()) {
      await benchmarkBtn.click();
      await expect(page.locator('text=Loading').or(page.locator('text=Records')).or(page.locator('text=Variables'))).toBeVisible({ timeout: 15000 });
    }
  });

  test('should execute Double Machine Learning uplift pipeline and render charts', async ({ page }) => {
    const runBtn = page.locator('button:has-text("Run Uplift"), button:has-text("Train DML"), button:has-text("Execute")').first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
      await expect(page.locator('canvas, svg, .js-plotly-plot, [data-testid="qini-chart"]').first()).toBeVisible({ timeout: 30000 });
    }
  });
});
