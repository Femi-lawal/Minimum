import { test, expect } from '@playwright/test';
import { BASE_URL, loginTestUser } from './fixtures';

test.describe('Settings Page Tests', () => {
  // Tests for unauthenticated state
  test.describe('Unauthenticated', () => {
    test('should show "Please log in" when not authenticated', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await expect(page.getByText('Please log in')).toBeVisible({ timeout: 10000 });
    });

    test('should have a link to login page', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await expect(page.getByRole('link', { name: 'Go to Login' })).toBeVisible({ timeout: 10000 });
    });
  });

  // Tests for authenticated state (using demo login if available)
  test.describe('Authenticated', () => {
    test.beforeEach(async ({ page }) => {
      // First login
      await loginTestUser(page);
      // Then navigate to settings
      await page.goto(`${BASE_URL}/settings`);
      // Wait for settings page to load
      await page.waitForLoadState('networkidle');
    });

    test('should display Settings heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 });
    });

    test('should display Account tab', async ({ page }) => {
      await expect(page.getByText('Account', { exact: true })).toBeVisible({ timeout: 10000 });
    });

    test('should display Profile Information section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Profile Information' })).toBeVisible({ timeout: 10000 });
    });

    test('should have Avatar URL input', async ({ page }) => {
      await expect(page.getByText('Avatar URL')).toBeVisible();
      const avatarInput = page.getByPlaceholder('https://example.com/avatar.jpg');
      await expect(avatarInput).toBeVisible();
    });

    test('should have Display Name input', async ({ page }) => {
      await expect(page.getByText('Display Name')).toBeVisible();
      const nameInput = page.getByPlaceholder('Your name');
      await expect(nameInput).toBeVisible();
    });

    test('should have Short Bio textarea', async ({ page }) => {
      await expect(page.getByText('Short Bio')).toBeVisible();
      const bioTextarea = page.getByPlaceholder('Tell us about yourself...');
      await expect(bioTextarea).toBeVisible();
    });

    test('should have Save Changes button', async ({ page }) => {
      const saveButton = page.getByRole('button', { name: 'Save Changes' });
      await expect(saveButton).toBeVisible();
    });

    test('should display Danger Zone section', async ({ page }) => {
      await expect(page.getByText('Danger Zone')).toBeVisible();
    });

    test('should have Log out button in Danger Zone', async ({ page }) => {
      // Get the Log out button (the one that is a button, not the label)
      const logoutButton = page.getByRole('button', { name: 'Log out' });
      await expect(logoutButton).toBeVisible();
    });
  });
});
