import { test, expect } from '@playwright/test';

test('application walkthrough', async ({ page }) => {
  test.setTimeout(120000);
  console.log('Starting Walkthrough...');
  // 1. Landing Page
  console.log('Step 1: Landing Page');
  await page.goto('/');
  await page.waitForTimeout(1000); 

  // ... (scrolling) ...

  // 2. Login via Demo
  console.log('Step 2: Login');
  await page.click('text=Sign in');
  await page.waitForTimeout(500);
  await page.click('text=try the demo account');
  await expect(page).toHaveURL('/dashboard');
  console.log('Login Complete');

  // 3. View Feed & Interactions
  console.log('Step 3: Feed & Interactions');
  await expect(page.locator('article').first()).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2000); // Let feed breathe

  // Check Categories (Tags) - Scroll horizontal list if needed
  console.log('Checking Categories');
  const tagChip = page.locator('button:has-text("Technology"), button:has-text("Programming")').first();
  if (await tagChip.isVisible()) {
      await tagChip.click();
      await page.waitForTimeout(2500); // Longer pause to see filter
      await page.click('text=For you');
      await page.waitForTimeout(2000);
  }

  // Scroll Feed specifically
  console.log('Scrolling Feed');
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1500);
  
  // Interact with second post if available
  const articles = page.locator('article');
  const count = await articles.count();
  
  if (count > 1) {
      const secondPost = articles.nth(1);
      await secondPost.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      const clapBtn = secondPost.locator('button[aria-label="Clap"]');
      if (await clapBtn.isVisible()) {
          await clapBtn.click();
          await page.waitForTimeout(1000);
      }
  }

  // Find Main Post to interact with (First one)
  console.log('Finding Main Post');
  await page.evaluate(() => window.scrollTo(0, 0)); // Back up
  await page.waitForTimeout(1000);
  
  const firstPost = page.locator('article').first();
  await firstPost.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  
  // Toggle Clap (Feed)
  const feedClapBtn = firstPost.locator('button[aria-label="Clap"]');
  if (await feedClapBtn.isVisible()) {
      await feedClapBtn.click();
      await page.waitForTimeout(1000);
  }
  
  // Toggle Bookmark (Feed)
  const bookmarkBtn = firstPost.locator('button[aria-label="Bookmark"]');
  if (await bookmarkBtn.isVisible()) {
      await bookmarkBtn.click();
      await page.waitForTimeout(1000);
  }

  // Open Post
  console.log('Opening Post');
  const postTitle = firstPost.locator('h2');
  await postTitle.click();
  await expect(page).toHaveURL(/\/post\//); 
  console.log('Post Opened');
  await page.waitForTimeout(3000); // Allow time to read title/author

  // ... (Follow/Comment) ...
  console.log('Commenting');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2)); // Scroll half way
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000); // Pause at bottom
  // ... (comment logic) ...
  console.log('Comment Done');

  // Go back to Dashboard
  console.log('Returning to Dashboard');
  await page.click('a[href="/dashboard"]');
  await expect(page).toHaveURL('/dashboard');
  console.log('Back on Dashboard');
  await page.waitForTimeout(1500);

  // 4. Create Post
  console.log('Step 4: Create Post');
  await page.click('a[href="/post/new"]');
  await expect(page).toHaveURL(/\/post\/new/);
  await page.waitForTimeout(1000);

  await page.fill('input[placeholder="Title"]', 'The Future of Serverless Go');
  await page.waitForTimeout(500);
  await page.fill('textarea[placeholder="Tell your story..."]', 'Migrating to a monolithic Lambda was easier than I thought.');
  await page.waitForTimeout(500);
  
  // Fill Tags (Inline input)
  await page.fill('input[placeholder="Add tags (comma separated)..."]', 'Serverless, Go');
  await page.waitForTimeout(500);

  // Publish
  console.log('Publishing');
  await page.click('button:has-text("Publish")');
  
  // Expect redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  console.log('Post Published');

  // 5. User Profile
  console.log('Step 5: Profile');
  await page.waitForTimeout(1500);
  
  // Navigate to Profile via header avatar
  await page.click('a[href="/dashboard/profile"]');
  await expect(page).toHaveURL('/dashboard/profile');
  await page.waitForTimeout(2000);
  
  // Scroll to see profile content
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(1500);
  console.log('Profile Viewed');

  // 6. Settings
  console.log('Step 6: Settings');
  
  // Navigate to Settings via Sidebar
  await page.click('a[href="/settings"]');
  await expect(page).toHaveURL('/settings');
  await page.waitForTimeout(2000);
  
  // Scroll to see all settings sections
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(1500);
  
  // Scroll to Danger Zone at bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  console.log('Settings Viewed');

  // 7. Logout
  console.log('Step 7: Logout');
  console.log('Logging out...');
  
  // Click Log out in Danger Zone (already on settings page)
  await page.click('button:has-text("Log out")');
  
  // Verify redirect to landing page
  await expect(page).toHaveURL('/');
  await page.waitForTimeout(1500);
  console.log('Walkthrough Completed Successfully.');
});
