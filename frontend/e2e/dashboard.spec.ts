import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  // Mock login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard layout', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('text=Minimum')).toBeVisible();
  });

  test('should have profile link', async ({ page }) => {
    await expect(page.locator('a[href="/dashboard/profile"]')).toBeVisible();
  });

  test('should be able to logout', async ({ page }) => {
    await page.click('text=Sign out');
    await expect(page).toHaveURL(/\/login/);
  });
});
