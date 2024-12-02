import { test, expect } from '@playwright/test';
import { BASE_URL } from './fixtures';

test.describe('Authentication Tests', () => {
  test.describe('Login Page', () => {
    test('should display login page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      // Check page loads
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Registration Page', () => {
    test('should display registration page', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      // Check page loads
      await expect(page).toHaveURL(/\/register/);
    });
  });

  // Skip logout test - feature not implemented
  test.describe('Logout', () => {
    test.skip('should logout and redirect to login', async ({ page }) => {
      // Skipped - logout not implemented
    });
  });
});
