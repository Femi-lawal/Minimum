/**
 * Shared test fixtures and utilities for E2E tests
 */

import { Page, expect } from '@playwright/test';

// Demo user credentials - matches the seeded user in the database
export const TEST_USER = {
    email: 'alice@example.com',
    password: 'demo123',
    name: 'Alice Chen',
    id: '00000000-0000-0000-0000-000000000001',
};

// Base URL for tests - use environment variable or default
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// API URL for direct API calls in tests
export const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8080';

/**
 * Helper function to login with the test user
 * Includes proper waits and error handling for reliable test execution
 */
export async function loginTestUser(page: Page) {
    // Navigate to login page and wait for it to load
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    // Wait for the login form to be visible
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    
    // Fill in credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Click submit and wait for navigation with proper timeout
    await Promise.all([
        page.waitForURL(/\/dashboard/, { timeout: 30000 }),
        page.click('button[type="submit"]'),
    ]);
    
    // Wait for dashboard to fully load
    await page.waitForLoadState('networkidle');
}

/**
 * Helper function to check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
    try {
        // Check for common logged-in indicators
        await page.waitForURL(/\/dashboard/, { timeout: 5000 });
        return true;
    } catch {
        return false;
    }
}

/**
 * Helper function to logout
 */
export async function logoutUser(page: Page) {
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle' });
    const logoutButton = page.getByRole('button', { name: 'Log out' });
    if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForURL(/\/$/, { timeout: 10000 });
    }
}

/**
 * Helper to wait for API responses
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
    return page.waitForResponse((response) => {
        if (typeof urlPattern === 'string') {
            return response.url().includes(urlPattern);
        }
        return urlPattern.test(response.url());
    });
}
