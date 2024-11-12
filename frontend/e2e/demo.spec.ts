import { test, expect } from '@playwright/test';

test.describe('Demo Flow', () => {
  // These tests require login functionality which isn't fully implemented
  // Using direct navigation instead
  
  test('should load landing page and navigate to dashboard', async ({ page }) => {
    await page.goto('/');
    // Landing page should have Get started button
    await expect(page.getByText('Get started')).toBeVisible();
    
    // Navigate directly to dashboard (bypassing login)
    await page.goto('/dashboard');
    await expect(page.getByText('For you')).toBeVisible();
  });

  test('should load user profile page', async ({ page }) => {
    // Navigate directly to Alice Chen's profile
    await page.goto('/user/00000000-0000-0000-0000-000000000001');
    
    await expect(page.getByText('Followers')).toBeVisible();
    await expect(page.getByText('Following')).toBeVisible();
  });
});
