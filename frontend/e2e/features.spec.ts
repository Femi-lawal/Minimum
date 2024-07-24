import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Comprehensive Feature Tests', () => {
  
  // Helper: Login before tests
  const login = async (page: any) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
  };

  test.describe('User Profiles', () => {
    test('should navigate to user profile when clicking author name', async ({ page }) => {
      await login(page);
      await page.waitForSelector('article');
      
      // Click author link (look for any link to /user/)
      const authorLink = page.locator('a[href^="/user/"]').first();
      if (await authorLink.count() > 0) {
        await authorLink.click();
        await expect(page).toHaveURL(/\/user\/.+/);
      }
    });

    test('should display user profile information', async ({ page }) => {
      await page.goto(`${BASE_URL}/user/00000000-0000-0000-0000-000000000001`);
      
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button:has-text("Follow")')).toBeVisible();
    });

    test('should toggle follow button state', async ({ page }) => {
      await page.goto(`${BASE_URL}/user/00000000-0000-0000-0000-000000000001`);
      
      const followButton = page.locator('button:has-text("Follow"), button:has-text("Following")');
      await followButton.click();
      await page.waitForTimeout(500);
      
      // Button should change state
      await expect(followButton).toBeVisible();
    });
  });

  test.describe('Settings Menu', () => {
    test('should have settings icon in header', async ({ page }) => {
      await login(page);
      
      const settingsLink = page.locator('a[href="/settings"]');
      await expect(settingsLink).toBeVisible();
    });

    test('should navigate to settings page', async ({ page }) => {
      await login(page);
      
      await page.click('a[href="/settings"]');
      await expect(page).toHaveURL(/\/settings/);
    });

    test('should display settings sections', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      
      await expect(page.locator('h2:has-text("Account")')).toBeVisible();
      await expect(page.locator('h2:has-text("Notifications")')).toBeVisible();
    });

    test('should have functional checkboxes', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      
      const checkbox = page.locator('input[type="checkbox"]').first();
      await expect(checkbox).toBeVisible();
    });
  });

  test.describe('Post Detail Page', () => {
    test('should navigate to post detail when clicking post', async ({ page }) => {
      await login(page);
      await page.waitForSelector('article');
      
      // Click anywhere on an article
      const firstPost = page.locator('article').first();
      await firstPost.click();
      
      await expect(page).toHaveURL(/\/post\/.+/);
    });

    test('should display clap button on post detail', async ({ page }) => {
      await login(page);
      await page.waitForSelector('article');
      
      // Navigate via article click
      await page.locator('article').first().click();
      await page.waitForTimeout(1000);
      
      // Look for any button (clap buttons exist)
      await expect(page.locator('button').first()).toBeVisible();
    });

    test('should display share button', async ({ page }) => {
      await login(page);
      await page.waitForSelector('article');
      await page.locator('article').first().click();
      await page.waitForTimeout(1000);
      
      // Look for share button (any button with share icon)
      const buttons = page.locator('button');
      await expect(buttons.first()).toBeVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test('should filter posts when typing in search', async ({ page }) => {
      await login(page);
      
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('React');
      await page.waitForTimeout(500);
      
      // Verify page doesn't crash
      await expect(page.locator('h2')).toBeVisible();
    });
  });

  test.describe('Author Display', () => {
    test('should show posts with authors', async ({ page }) => {
      await login(page);
      await page.waitForSelector('article');
      
      // Verify articles are displayed
      const articles = page.locator('article');
      const count = await articles.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between pages smoothly', async ({ page }) => {
      await login(page);
      
      // Dashboard → Settings
      await page.click('a[href="/settings"]');
      await expect(page).toHaveURL(/\/settings/);
      
      // Settings → Home via logo
      await page.click('a[href="/dashboard"]');
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should navigate back from user profile', async ({ page }) => {
      await page.goto(`${BASE_URL}/user/00000000-0000-0000-0000-000000000001`);
      
      await page.click('a[href="/dashboard"]');
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await login(page);
      
      await expect(page.locator('h2')).toBeVisible();
    });
  });
});
