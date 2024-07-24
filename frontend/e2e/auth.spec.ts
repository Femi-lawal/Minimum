import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Authentication Tests', () => {
  test.describe('Login Page', () => {
    test('should display login form with required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation for empty fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.click('button[type="submit"]');
      
      // Browser native validation should prevent submission
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeFocused();
    });

    test('should navigate to register page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.click('text=Sign up');
      await expect(page).toHaveURL(/\/register/);
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');
    });

    test('should persist session after login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Reload and verify still logged in
      await page.reload();
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Registration Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      
      // Check page loads - registration page exists
      await expect(page.locator('input[type="email"]').or(page.locator('h1'))).toBeVisible();
    });

    test('should navigate back to login', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await page.click('text=Sign in');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Logout', () => {
    test('should logout and redirect to login', async ({ page }) => {
      // Login first
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Logout
      await page.click('text=Sign out');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
