import { test, expect } from '@playwright/test';
import { BASE_URL } from './fixtures';

test.describe('Comprehensive Navigation & Feature Tests', () => {

    // Use desktop viewport to ensure sidebars are visible
    test.use({ viewport: { width: 1280, height: 800 } });

    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/dashboard`);
        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');
    });

    test('should navigate sidebar links (Lists, Stats)', async ({ page }) => {
        // 1. Verify Dashboard (Home)
        await expect(page.getByText('For you')).toBeVisible();

        // 2. Navigate to Lists (via left sidebar)
        const listsLink = page.locator('aside').first().locator('a[href="/dashboard/lists"]');
        await listsLink.click();
        await expect(page).toHaveURL(`${BASE_URL}/dashboard/lists`);
        await expect(page.getByRole('heading', { name: 'Your lists' })).toBeVisible();

        // 3. Navigate to Stats (via left sidebar)
        const statsLink = page.locator('aside').first().locator('a[href="/dashboard/stats"]');
        await statsLink.click();
        await expect(page).toHaveURL(`${BASE_URL}/dashboard/stats`);
        await expect(page.getByRole('heading', { name: 'Stats', exact: true })).toBeVisible();
    });

    test('should navigate to Stories page', async ({ page }) => {
        // Navigate to Stories via left sidebar
        const storiesLink = page.locator('aside').first().locator('a[href="/dashboard/stories"]');
        await storiesLink.click();
        await expect(page).toHaveURL(`${BASE_URL}/dashboard/stories`);
        await expect(page.getByRole('heading', { name: 'Your stories' })).toBeVisible();
    });

    test('should display Left Sidebar on desktop', async ({ page }) => {
        // Sidebar should be visible
        const sidebar = page.locator('aside').first();
        await expect(sidebar).toBeVisible();
        
        // Check for expected navigation items
        await expect(sidebar.locator('a[href="/dashboard"]')).toBeVisible();
        await expect(sidebar.locator('a[href="/dashboard/lists"]')).toBeVisible();
    });

    test('should navigate to Topic page from Right Sidebar', async ({ page }) => {
        // Target the RIGHT sidebar specifically (second aside element)
        // RightSidebar contains "Recommended topics" section
        const rightSidebar = page.locator('aside').nth(1);
        await expect(rightSidebar).toBeVisible();

        // Find the Technology link within the "Recommended topics" section
        const topicsSection = rightSidebar.locator('h4:has-text("Recommended topics")').locator('..'); 
        const techLink = topicsSection.locator('a[href="/dashboard/topic/technology"]');
        
        await expect(techLink).toBeVisible();
        await techLink.click();

        await expect(page).toHaveURL(`${BASE_URL}/dashboard/topic/technology`);
        await expect(page.getByRole('heading', { name: 'Technology' })).toBeVisible();
    });

    test('should display search input in Right Sidebar', async ({ page }) => {
        const rightSidebar = page.locator('aside').nth(1);
        const searchInput = rightSidebar.getByPlaceholder('Search');
        await expect(searchInput).toBeVisible();
        await searchInput.fill('React');
        // Search is currently UI-only, so just verify input works
        await expect(searchInput).toHaveValue('React');
    });
});
