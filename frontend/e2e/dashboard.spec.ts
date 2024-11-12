import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display dashboard layout', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('text=Minimum')).toBeVisible();
  });

  test('should display For you tab', async ({ page }) => {
    await expect(page.getByText('For you')).toBeVisible();
  });

  // Skip logout - not implemented
  test.skip('should be able to logout', async ({ page }) => {
    // Skipped - logout not implemented
  });
});
