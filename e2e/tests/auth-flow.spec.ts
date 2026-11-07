import { test, expect } from '@playwright/test';

test.describe('Authentication & Access Control Flow', () => {
  test('should display login modal/form when accessing protected areas', async ({ page }) => {
    await page.goto('/');
    const authBtn = page.locator('button:has-text("Login"), button:has-text("Sign In"), [aria-label="User Profile"], [data-testid="auth-button"]').first();
    if (await authBtn.isVisible()) {
      await authBtn.click();
      await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    }
  });

  test('should reject invalid credentials with an error message', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'admin@econocausal.ai',
        password: 'IncorrectPassword999!',
      },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.detail).toContain('Incorrect email or password');
  });

  test('should authenticate admin and return JWT access token', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'admin@econocausal.ai',
        password: 'AdminPass123!',
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.access_token).toBeDefined();
    expect(body.token_type).toBe('bearer');
  });

  test('should protect authenticated /me endpoint without credentials', async ({ request }) => {
    const response = await request.get('/api/auth/me');
    expect(response.status()).toBe(401);
  });
});
