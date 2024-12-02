import { test, expect } from '@playwright/test';
import { BASE_URL } from './fixtures';

test.describe('Settings Page Tests', () => {
  // Skip the login flow - settings page is accessible directly
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
  });

  test.describe('Navigation', () => {
    test('should display settings heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    });
  });

  test.describe('Account Section', () => {
    test('should display email address', async ({ page }) => {
      await expect(page.getByText('Email address')).toBeVisible();
      await expect(page.getByText('test@example.com')).toBeVisible();
    });

    test('should display username', async ({ page }) => {
      await expect(page.getByText('Username', { exact: true })).toBeVisible();
      await expect(page.getByText('@demo_user', { exact: true })).toBeVisible();
    });

    test('should have edit buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Edit email' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Edit username' })).toBeVisible();
    });
  });

  test.describe('Notification Settings', () => {
    test('should display notification section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Email Notifications' })).toBeVisible();
    });

    test('should have notification checkbox', async ({ page }) => {
      await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
    });
  });

  test.describe('Danger Zone', () => {
    test('should display danger zone section', async ({ page }) => {
      await expect(page.getByText('Danger Zone')).toBeVisible();
    });

    test('should have deactivate and delete buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Deactivate account' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Delete account' })).toBeVisible();
    });
  });
});
