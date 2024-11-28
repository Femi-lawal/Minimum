import { test, expect } from '@playwright/test';
import { BASE_URL, TEST_USER, loginTestUser } from './fixtures';

test.describe('Social Interactions', () => {
    
    test.beforeEach(async ({ page }) => {
        // Ensure user is logged in
        await loginTestUser(page);
    });

    test('Clap for a post', async ({ page }) => {
        // Go to dashboard
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForLoadState('networkidle');

        // Screenshot to see what we have
        await page.screenshot({ path: 'screenshots/debug-dashboard-clap.png' });
        
        // Use generic selector first to debug
        const articles = page.locator('article');
        const count = await articles.count();
        console.log(`Found ${count} articles`);
        expect(count).toBeGreaterThan(0);

        const clapButton = articles.first().locator('button[title="Clap"]');
        await expect(clapButton).toBeVisible();
        
        // Get initial count (might be empty string if 0)
        let initialText = await clapButton.textContent();
        let initialCount = parseInt(initialText || '0');

        // Click clap
        await clapButton.click();
        
        // Get new text
        await page.waitForTimeout(500); // Wait for optimistic update
        let newText = await clapButton.textContent();
        let newCount = parseInt(newText || '0');

        // Expect change
        expect(newCount).not.toBe(initialCount);
    });

    test('Bookmark a post', async ({ page }) => {
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForLoadState('networkidle');

        const articles = page.locator('article');
        expect(await articles.count()).toBeGreaterThan(0);

        // Find bookmark button
        const bookmarkButton = articles.first().locator('button[title*="Bookmark"]');
        await expect(bookmarkButton).toBeVisible();

        // Check initial state check via class or title
        const initialTitle = await bookmarkButton.getAttribute('title');
        
        // Click to toggle
        await bookmarkButton.click();

        // Expect title to flip
        await page.waitForTimeout(500); 
        const newTitle = await bookmarkButton.getAttribute('title');
        expect(newTitle).not.toBe(initialTitle);
    });

    test('Follow a user', async ({ page }) => {
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForLoadState('networkidle');
        
        // Find an author link
        const authorLink = page.locator('article').first().locator('a[href^="/user/"]');
        if (await authorLink.count() === 0) {
            console.log('No author link found');
            return;
        }

        const authorUrl = await authorLink.getAttribute('href');
        await page.goto(`${BASE_URL}${authorUrl}`);
        
        const followButton = page.getByRole('button', { name: /Follow/i });
        
        if (await followButton.count() > 0) {
            const initialText = await followButton.textContent();
            await followButton.click();
            await page.waitForTimeout(500);
            
            if (initialText?.includes("Following")) {
                await expect(followButton).toHaveText("Follow");
            } else {
                await expect(followButton).toHaveText("Following");
            }
        }
    });

    test('Check Notifications', async ({ page }) => {
        await page.goto(`${BASE_URL}/dashboard`);
        
        // Open dropdown via aria-label
        const bellButton = page.getByLabel('Notifications');
        await expect(bellButton).toBeVisible();
        await bellButton.click();

        // Dropdown should appear
        const dropdown = page.getByText('Notifications', { exact: true });
        await expect(dropdown).toBeVisible();
    });

});
