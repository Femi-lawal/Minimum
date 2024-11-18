/**
 * Shared test fixtures and utilities for E2E tests
 */

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
 */
export async function loginTestUser(page: import('@playwright/test').Page) {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
}
