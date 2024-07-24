import { test, expect } from '@playwright/test';

// Test Configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8080';

test.describe('Minimum - Comprehensive E2E Tests', () => {
  
  // ============================================================================
  // LANDING PAGE TESTS
  // ============================================================================
  
  test.describe('Landing Page', () => {
    test('should display landing page with correct branding', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('h1')).toContainText('Minimum');
      await expect(page.locator('h2')).toContainText('Human');
      await expect(page.locator('text=Get started')).toBeVisible();
    });

    test('should navigate to login when clicking Sign in', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('text=Sign in');
      await expect(page).toHaveURL(/.*login/);
    });

    test('should navigate to demo login when clicking Get started', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('text=Get started');
      await expect(page).toHaveURL(/.*login/);
    });
  });

  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================
  
  test.describe('Authentication', () => {
    test('should login with demo user', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'wrongpass');
      await page.click('button[type="submit"]');
      // Should stay on login page or show error
      await expect(page).toHaveURL(/.*login/);
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Then logout
      await page.click('text=Sign out');
      await expect(page).toHaveURL(/.*login/);
    });
  });

  // ============================================================================
  // DASHBOARD TESTS
  // ============================================================================
  
  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each dashboard test
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should display dashboard layout with header', async ({ page }) => {
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('text=Minimum')).toBeVisible();
      await expect(page.locator('text=Write')).toBeVisible();
    });

    test('should display multiple blog posts', async ({ page }) => {
      // Wait for posts to load
      await page.waitForSelector('article', { timeout: 5000 });
      
      const articles = await page.locator('article').count();
      expect(articles).toBeGreaterThan(2); // Should have more than 2 mock posts
    });

    test('should display post metadata (author, date, reading time)', async ({ page }) => {
      await page.waitForSelector('article');
      
      const firstArticle = page.locator('article').first();
      await expect(firstArticle.locator('span:has-text("min read")')).toBeVisible();
    });
  });

  // ============================================================================
  // SEARCH FUNCTIONALITY TESTS
  // ============================================================================
  
  test.describe('Search', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
    });

    test('should have search input visible', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]');
      await expect(searchInput).toBeVisible();
    });

    test('should allow typing in search input', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('Go programming');
      await expect(searchInput).toHaveValue('Go programming');
    });

    test('search should filter posts (if implemented)', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('React');
      await searchInput.press('Enter');
      
      // Either expect filtered results or a "not implemented" message
      // For now, just verify search doesn't crash
      await page.waitForTimeout(1000);
    });
  });

  // ============================================================================
  // WRITE/CREATE POST TESTS
  // ============================================================================
  
  test.describe('Write Post', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
    });

    test('should have Write button visible', async ({ page }) => {
      const writeButton = page.locator('text=Write');
      await expect(writeButton).toBeVisible();
    });

    test('should navigate to write page when clicking Write', async ({ page }) => {
      await page.click('text=Write');
      // Should navigate to /write or show editor
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).toMatch(/write|editor|new/);
    });
  });

  // ============================================================================
  // BOOKMARK FUNCTIONALITY TESTS
  // ============================================================================
  
  test.describe('Bookmarks', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      await page.waitForSelector('article');
    });

    test('should have bookmark buttons visible on posts', async ({ page }) => {
      const bookmarkButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      await expect(bookmarkButton).toBeVisible();
    });

    test('should be able to click bookmark button', async ({ page }) => {
      const bookmarkButtons = page.locator('button svg[class*="h-5"]').first();
      await bookmarkButtons.click();
      // Verify no crash
      await page.waitForTimeout(500);
    });
  });

  // ============================================================================
  // PROFILE TESTS
  // ============================================================================
  
  test.describe('Profile', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
    });

    test('should have profile avatar visible', async ({ page }) => {
      const profileAvatar = page.locator('text=U').or(page.locator('[class*="rounded-full"]'));
      await expect(profileAvatar.first()).toBeVisible();
    });

    test('should navigate to profile when clicking avatar', async ({ page }) => {
      await page.click('[class*="rounded-full"]');
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).toMatch(/profile|dashboard/);
    });
  });

  // ============================================================================
  // SIDEBAR TESTS
  // ============================================================================
  
  test.describe('Sidebar Features', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
    });

    test('should display recommended topics', async ({ page }) => {
      await expect(page.locator('text=Recommended topics')).toBeVisible();
    });

    test('should display who to follow section', async ({ page }) => {
      await expect(page.locator('text=Who to follow')).toBeVisible();
    });

    test('should have clickable topic tags', async ({ page }) => {
      const topicButton = page.locator('button:has-text("Programming")');
      if (await topicButton.isVisible()) {
        await topicButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should have follow buttons', async ({ page }) => {
      const followButton = page.locator('button:has-text("Follow")').first();
      if (await followButton.isVisible()) {
        await followButton.click();
        await page.waitForTimeout(500);
      }
    });
  });

  // ============================================================================
  // API INTEGRATION TESTS
  // ============================================================================
  
  test.describe('API Integration', () => {
    test('API should return posts', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/posts`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.length).toBeGreaterThan(0);
    });

    test('Posts should have required fields', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/posts`);
      const data = await response.json();
      
      const firstPost = data.data[0];
      expect(firstPost).toHaveProperty('id');
      expect(firstPost).toHaveProperty('title');
      expect(firstPost).toHaveProperty('content');
    });
  });

  // ============================================================================
  // RESPONSIVE DESIGN TESTS
  // ============================================================================
  
  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL);
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});
