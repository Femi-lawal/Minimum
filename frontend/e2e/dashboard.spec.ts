import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  // Mock login before each test
  test.beforeEach(async ({ page }) => {
    // In a real app, we would seed the database or mock the API response
    // For now, we just bypass login or assume the mock login works
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    // Wait for navigation
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard layout', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=AppName')).toBeVisible();
  });

  test('should have profile link', async ({ page }) => {
    await expect(page.locator('a[href="/dashboard/profile"]')).toBeVisible();
  });

  test('should be able to logout', async ({ page }) => {
    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL('/login');
  });
});
