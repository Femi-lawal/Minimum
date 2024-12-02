import { test, expect } from '@playwright/test';
import { BASE_URL } from './fixtures';

test.describe('User Profile Tests', () => {
  // Use direct navigation
  const goToProfile = async (page: any) => {
    await page.goto(`${BASE_URL}/user/00000000-0000-0000-0000-000000000001`);
  };

  test.describe('Profile Navigation', () => {
    test('should navigate to profile from author link', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      const authorLink = page.locator('a[href^="/user/"]').first();
      await authorLink.click();
      await expect(page).toHaveURL(/\/user\//);
    });
  });

  test.describe('Profile Page Content', () => {
    test('should display user avatar', async ({ page }) => {
      await goToProfile(page);
      // Actual app uses ui-avatars.com or real URL. Image itself has rounded-full.
      await expect(page.locator('img.rounded-full').first()).toBeVisible();
    });

    test('should display user name', async ({ page }) => {
      await goToProfile(page);
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should display follower counts', async ({ page }) => {
      await goToProfile(page);
      // Check for follower-related text
      await expect(page.getByText('Followers', { exact: false })).toBeVisible(); // 10 Followers
    });

    test('should display user bio', async ({ page }) => {
      await goToProfile(page);
      await expect(page.locator('p').first()).toBeVisible();
    });
  });

  test.describe('Follow Functionality', () => {
    test('should display follow button', async ({ page }) => {
      await goToProfile(page);
      await expect(page.locator('button:has-text("Follow"), button:has-text("Following")')).toBeVisible();
    });

    test('should toggle follow state on click', async ({ page }) => {
      await goToProfile(page);
      
      const followButton = page.locator('button:has-text("Follow"), button:has-text("Following")');
      const initialText = await followButton.innerText();
      
      await followButton.click();
      await page.waitForTimeout(300); // Wait for mock api/state update
      
      const newText = await followButton.innerText();
      expect(newText).not.toBe(initialText);
    });
  });

  test.describe('User Posts', () => {
    test('should display posts section', async ({ page }) => {
      await goToProfile(page);
      
      // Header says "LATEST" or "Latest"
      await expect(page.getByText('Latest', { exact: false })).toBeVisible();
    });
  });
});
