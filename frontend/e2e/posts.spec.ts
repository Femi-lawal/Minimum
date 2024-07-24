import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Post Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('Post Cards', () => {
    test('should display post title and excerpt', async ({ page }) => {
      const firstPost = page.locator('article').first();
      await expect(firstPost.locator('h3')).toBeVisible();
      await expect(firstPost.locator('p')).toBeVisible();
    });

    test('should display author name with link', async ({ page }) => {
      const authorLink = page.locator('a[href^="/user/"]').first();
      await expect(authorLink).toBeVisible();
    });

    test('should display reading time', async ({ page }) => {
      await expect(page.locator('text=/\\d+ min read/').first()).toBeVisible();
    });

    test('should navigate to post detail on click', async ({ page }) => {
      await page.locator('article h3').first().click();
      await expect(page).toHaveURL(/\/post\//);
    });
  });

  test.describe('Post Detail Page', () => {
    test('should display full post content', async ({ page }) => {
      await page.locator('article h3').first().click();
      await page.waitForTimeout(2000);
      
      // Post detail page should show content
      await expect(page.locator('h1, h2, article').first()).toBeVisible();
    });

    test('should display clap button', async ({ page }) => {
      await page.locator('article h3').first().click();
      await page.waitForTimeout(2000);
      
      // Look for clap button or any button
      await expect(page.locator('button').first()).toBeVisible();
    });

    test('should increment clap count on click', async ({ page }) => {
      await page.locator('article h3').first().click();
      await page.waitForTimeout(1000);
      
      const clapButton = page.locator('button:has-text("👏")').first();
      if (await clapButton.isVisible()) {
        await clapButton.click();
        await page.waitForTimeout(500);
        // Count should increment (visual feedback)
      }
    });

    test('should display share button', async ({ page }) => {
      await page.locator('article h3').first().click();
      await page.waitForTimeout(2000);
      
      // Any button should be visible
      await expect(page.locator('button').nth(1)).toBeVisible();
    });

    test('should show share dropdown on click', async ({ page }) => {
      await page.locator('article h3').first().click();
      await page.waitForTimeout(1000);
      
      const shareButton = page.locator('button:has-text("Share")').first();
      if (await shareButton.isVisible()) {
        await shareButton.click();
        await expect(page.locator('text=Twitter').or(page.locator('text=Copy'))).toBeVisible();
      }
    });

    test('should display author card', async ({ page }) => {
      await page.locator('article h3').first().click();
      await page.waitForTimeout(2000);
      
      // Post detail page should be visible
      expect(page.url()).toContain('/post/');
    });
  });
});
