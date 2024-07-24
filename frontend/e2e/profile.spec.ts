import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('User Profile Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('Profile Navigation', () => {
    test('should navigate to profile from author link', async ({ page }) => {
      const authorLink = page.locator('a[href^="/user/"]').first();
      await authorLink.click();
      await expect(page).toHaveURL(/\/user\//);
    });

    test('should navigate to own profile from avatar', async ({ page }) => {
      await page.click('a[href="/dashboard/profile"]');
      await expect(page).toHaveURL('/dashboard/profile');
    });
  });

  test.describe('Profile Page Content', () => {
    test('should display user avatar', async ({ page }) => {
      await page.locator('a[href^="/user/"]').first().click();
      await page.waitForURL(/\/user\//);
      
      await expect(page.locator('img[src*="pravatar"]').first()).toBeVisible();
    });

    test('should display user name', async ({ page }) => {
      await page.locator('a[href^="/user/"]').first().click();
      await page.waitForURL(/\/user\//);
      
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should display follower counts', async ({ page }) => {
      await page.locator('a[href^="/user/"]').first().click();
      await page.waitForURL(/\/user\//);
      await page.waitForTimeout(1000);
      
      // Check for follower-related text
      await expect(page.locator('strong').first()).toBeVisible();
    });

    test('should display user bio', async ({ page }) => {
      await page.locator('a[href^="/user/"]').first().click();
      await page.waitForURL(/\/user\//);
      
      // Bio text should be visible
      await expect(page.locator('p').first()).toBeVisible();
    });
  });

  test.describe('Follow Functionality', () => {
    test('should display follow button', async ({ page }) => {
      await page.locator('a[href^="/user/"]').first().click();
      await page.waitForURL(/\/user\//);
      
      await expect(page.locator('button:has-text("Follow")')).toBeVisible();
    });

    test('should toggle follow state on click', async ({ page }) => {
      await page.locator('a[href^="/user/"]').first().click();
      await page.waitForURL(/\/user\//);
      
      const followButton = page.locator('button:has-text("Follow")');
      await followButton.click();
      
      await expect(page.locator('button:has-text("Following")')).toBeVisible();
    });

    test('should toggle back to unfollow', async ({ page }) => {
      await page.locator('a[href^="/user/"]').first().click();
      await page.waitForURL(/\/user\//);
      
      const followButton = page.locator('button:has-text("Follow")');
      await followButton.click();
      await page.waitForTimeout(300);
      
      // Click again to unfollow
      await page.locator('button:has-text("Following")').click();
      await expect(page.locator('button:has-text("Follow")')).toBeVisible();
    });
  });

  test.describe('User Posts', () => {
    test('should display posts section', async ({ page }) => {
      await page.locator('a[href^="/user/"]').first().click();
      await page.waitForURL(/\/user\//);
      
      await expect(page.locator('text=/Posts/')).toBeVisible();
    });
  });
});
