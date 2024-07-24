import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Settings Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('Navigation', () => {
    test('should navigate to settings from header', async ({ page }) => {
      await page.click('a[href="/settings"]');
      await expect(page).toHaveURL('/settings');
    });

    test('should display settings heading', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    });
  });

  test.describe('Account Section', () => {
    test('should display email input', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('should display username input', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await expect(page.locator('input[type="text"]').first()).toBeVisible();
    });

    test('should have disabled inputs by default', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await expect(page.locator('input[type="email"]')).toBeDisabled();
    });
  });

  test.describe('Notification Settings', () => {
    test('should display notification toggles', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      
      await expect(page.locator('h2:has-text("Notifications")')).toBeVisible();
      await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
    });

    test('should toggle email notifications', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      
      const checkbox = page.locator('input[type="checkbox"]').first();
      const isChecked = await checkbox.isChecked();
      
      await checkbox.click();
      await expect(checkbox).toHaveJSProperty('checked', !isChecked);
    });
  });

  test.describe('Privacy Settings', () => {
    test('should display privacy section', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await expect(page.locator('h2:has-text("Privacy")')).toBeVisible();
    });

    test('should have public profile toggle', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await expect(page.locator('text=Public profile')).toBeVisible();
    });
  });

  test.describe('Danger Zone', () => {
    test('should display danger zone section', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await expect(page.locator('text=Danger Zone')).toBeVisible();
    });

    test('should have delete account button', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await expect(page.locator('button:has-text("Delete Account")')).toBeVisible();
    });
  });
});
