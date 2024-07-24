import { test, expect } from '@playwright/test';

test.describe('Demo Flow', () => {
  test('should be able to login with demo user', async ({ page }) => {
    // Go to landing page
    await page.goto('/');
    
    // Click Get started (leads to login)
    await page.click('text=Get started');
    
    // Should be on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Fill credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Verify dashboard loaded
    await expect(page.locator('h2')).toBeVisible();
  });

  test('should be able to view profile', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to profile
    await page.click('a[href="/dashboard/profile"]');
    
    // Verify profile page
    await expect(page).toHaveURL('/dashboard/profile');
  });
});
