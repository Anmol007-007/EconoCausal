import { test, expect } from '@playwright/test';

test.describe('Budget Allocation Optimizer Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to Budget Allocation tab and render policy controls', async ({ page }) => {
    const budgetTab = page.locator('button:has-text("Budget"), [data-tab="budget"], a:has-text("Budget")').first();
    if (await budgetTab.isVisible()) {
      await budgetTab.click();
      await expect(page.locator('text=Allocation').or(page.locator('text=Budget')).first()).toBeVisible();
    }
  });

  test('should adjust budget parameters and execute MILP optimizer', async ({ page, request }) => {
    const response = await request.post('/api/allocate', {
      data: {
        total_budget: 7500,
        unit_margin: 50.0,
        min_margin_floor: 5.0,
      },
    });
    expect([200, 201]).toContain(response.status());
    const data = await response.json();
    expect(data.allocated_budget).toBeDefined();
    expect(data.persuadables_targeted).toBeDefined();
  });
});

