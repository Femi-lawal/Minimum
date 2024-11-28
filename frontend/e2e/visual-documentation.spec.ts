import { test, expect } from '@playwright/test';
import { BASE_URL, TEST_USER, loginTestUser } from './fixtures';

/**
 * Comprehensive E2E Test Suite with Screenshots
 * Tests every feature of the Minimum blog platform
 */

// Screenshot directory
const SCREENSHOT_DIR = 'screenshots';

test.describe('Visual Documentation - All Features', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // ============================================================================
  // LANDING PAGE
  // ============================================================================
  test.describe('1. Landing Page', () => {
    test('1.1 Landing page hero section', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Verify hero content
      await expect(page.getByText('Human')).toBeVisible();
      await expect(page.getByText('stories & ideas')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Start reading' }).first()).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/01-landing-hero.png`,
        fullPage: true 
      });
    });

    test('1.2 Landing page header and navigation', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Verify header
      await expect(page.getByText('Minimum').first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Get started' })).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/02-landing-header.png` 
      });
    });

    test('1.3 Trending section', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Scroll to trending section
      await page.getByText('Trending on Minimum').scrollIntoViewIfNeeded();
      await expect(page.getByText('Trending on Minimum')).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/03-landing-trending.png` 
      });
    });
  });

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  test.describe('2. Authentication', () => {
    test('2.1 Login page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByText('Sign in to Minimum')).toBeVisible();
      await expect(page.getByPlaceholder('Email address')).toBeVisible();
      await expect(page.getByPlaceholder('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/04-login-page.png` 
      });
    });

    test('2.2 Login with demo user', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Fill credentials
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/05-login-filled.png` 
      });
      
      // Submit login
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      
      await expect(page).toHaveURL(/\/dashboard/);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/06-login-success-dashboard.png` 
      });
    });

    test('2.3 Registration page', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/\/register/);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/07-register-page.png` 
      });
    });

    test('2.4 Demo Auto-Login', async ({ page }) => {
      // Navigate with demo param
      await page.goto(`${BASE_URL}/login?demo=true`);
      
      // Should auto-redirect to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
      await expect(page).toHaveURL(/\/dashboard/);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/07b-demo-auto-login.png` 
      });
    });
  });

  // ============================================================================
  // DASHBOARD
  // ============================================================================
  test.describe('3. Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await loginTestUser(page);
    });

    test('3.1 Dashboard main feed', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Verify feed tabs
      await expect(page.getByText('For you')).toBeVisible();
      await expect(page.getByText('Following')).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/08-dashboard-feed.png`,
        fullPage: true 
      });
    });

    test('3.2 Left sidebar navigation', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const sidebar = page.locator('aside').first();
      await expect(sidebar).toBeVisible();
      
      // Verify sidebar links
      await expect(sidebar.locator('a[href="/dashboard"]')).toBeVisible();
      await expect(sidebar.locator('a[href="/dashboard/lists"]')).toBeVisible();
      await expect(sidebar.locator('a[href="/dashboard/stories"]')).toBeVisible();
      await expect(sidebar.locator('a[href="/dashboard/stats"]')).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/09-dashboard-left-sidebar.png` 
      });
    });

    test('3.3 Right sidebar with topics and search', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const rightSidebar = page.locator('aside').nth(1);
      await expect(rightSidebar).toBeVisible();
      
      // Verify search and topics
      await expect(rightSidebar.getByPlaceholder('Search')).toBeVisible();
      await expect(page.getByText('Recommended topics')).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/10-dashboard-right-sidebar.png` 
      });
    });

    test('3.4 Post cards display', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Wait for posts to load
      const articles = page.locator('article');
      await expect(articles.first()).toBeVisible();
      
      // Verify post card elements
      const firstPost = articles.first();
      await expect(firstPost.locator('h2')).toBeVisible(); // Title
      await expect(firstPost.locator('p').first()).toBeVisible(); // Content preview
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/11-dashboard-post-cards.png` 
      });
    });
  });

  // ============================================================================
  // NAVIGATION PAGES
  // ============================================================================
  test.describe('4. Navigation Pages', () => {
    test.beforeEach(async ({ page }) => {
      await loginTestUser(page);
    });

    test('4.1 Lists page', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/lists`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByRole('heading', { name: 'Your lists' })).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/12-lists-page.png`,
        fullPage: true 
      });
    });

    test('4.2 Stories page', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/stories`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByRole('heading', { name: 'Your stories' })).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/13-stories-page.png`,
        fullPage: true 
      });
    });

    test('4.3 Stats page', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/stats`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByRole('heading', { name: 'Stats' })).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/14-stats-page.png`,
        fullPage: true 
      });
    });
  });

  // ============================================================================
  // TOPIC PAGES
  // ============================================================================
  test.describe('5. Topic Pages', () => {
    test.beforeEach(async ({ page }) => {
      await loginTestUser(page);
    });

    test('5.1 Technology topic page', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/topic/technology`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByRole('heading', { name: 'Technology' })).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/15-topic-technology.png`,
        fullPage: true 
      });
    });

    test('5.2 Programming topic page', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/topic/programming`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByRole('heading', { name: 'Programming' })).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/16-topic-programming.png`,
        fullPage: true 
      });
    });

    test('5.3 Navigate to topic from sidebar', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      // Click topic link in right sidebar
      const rightSidebar = page.locator('aside').nth(1);
      const topicLink = rightSidebar.locator('a[href*="/topic/"]').first();
      
      if (await topicLink.isVisible()) {
        await topicLink.click();
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/17-topic-from-sidebar.png`,
          fullPage: true 
        });
      }
    });
  });

  // ============================================================================
  // POST DETAIL
  // ============================================================================
  test.describe('6. Post Detail Page', () => {
    test.beforeEach(async ({ page }) => {
      await loginTestUser(page);
    });

    test('6.1 View post detail', async ({ page }) => {
      // Navigate to dashboard and click first post
      await page.waitForLoadState('networkidle');
      
      const firstPostTitle = page.locator('article h2').first();
      await firstPostTitle.click();
      
      await page.waitForURL(/\/post\//);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/18-post-detail.png`,
        fullPage: true 
      });
    });

    test('6.2 Post interactions (clap, share)', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      // Navigate to first post
      const firstPostTitle = page.locator('article h2').first();
      await firstPostTitle.click();
      await page.waitForURL(/\/post\//);
      await page.waitForLoadState('networkidle');
      
      // Look for interaction buttons
      const clapButton = page.locator('button:has-text("👏")');
      const shareButton = page.locator('button:has-text("Share")');
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/19-post-interactions.png` 
      });
    });
  });

  // ============================================================================
  // NEW POST
  // ============================================================================
  test.describe('7. Create New Post', () => {
    test.beforeEach(async ({ page }) => {
      await loginTestUser(page);
    });

    test('7.1 New post page', async ({ page }) => {
      await page.goto(`${BASE_URL}/post/new`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByPlaceholder('Title')).toBeVisible();
      await expect(page.getByPlaceholder('Tell your story...')).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/20-new-post-empty.png`,
        fullPage: true 
      });
    });

    test('7.2 New post with content', async ({ page }) => {
      await page.goto(`${BASE_URL}/post/new`);
      await page.waitForLoadState('networkidle');
      
      // Fill updated post form fields
      await page.getByPlaceholder('Add a cover image URL (optional)').fill('https://picsum.photos/800/400');
      await page.getByPlaceholder('Title').fill('My Amazing Blog Post');
      await page.getByPlaceholder('Add tags (comma separated)...').fill('Technology, Testing, AI');
      
      await page.getByPlaceholder('Tell your story...').fill(
        'This is the content of my blog post. It contains interesting insights about technology and programming.'
      );
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/21-new-post-filled.png`,
        fullPage: true 
      });
      
      // Publish
      await page.click('button:has-text("Publish")');
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard/);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/21b-post-published.png`
      });
    });
  });

  // ============================================================================
  // USER PROFILE
  // ============================================================================
  test.describe('8. User Profile', () => {
    test.beforeEach(async ({ page }) => {
      await loginTestUser(page);
    });

    test('8.1 User profile page', async ({ page }) => {
      // Go to demo user profile
      await page.goto(`${BASE_URL}/user/${TEST_USER.id}`);
      await page.waitForLoadState('networkidle');
      
      // Verify profile elements
      await expect(page.locator('h1')).toBeVisible(); // User name
      await expect(page.locator('img.rounded-full').first()).toBeVisible(); // Avatar
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/22-user-profile.png`,
        fullPage: true 
      });
    });

    test('8.2 User profile followers section', async ({ page }) => {
      await page.goto(`${BASE_URL}/user/${TEST_USER.id}`);
      await page.waitForLoadState('networkidle');
      
      // Verify follower counts
      await expect(page.getByText('Followers')).toBeVisible();
      await expect(page.getByText('Following')).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/23-user-profile-followers.png` 
      });
    });

    test('8.3 Follow button interaction', async ({ page }) => {
      await page.goto(`${BASE_URL}/user/${TEST_USER.id}`);
      await page.waitForLoadState('networkidle');
      
      const followButton = page.locator('button:has-text("Follow"), button:has-text("Following")');
      await expect(followButton).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/24-user-follow-button.png` 
      });
    });

    test('8.4 Navigate to profile from post author', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      // Click on author link
      const authorLink = page.locator('a[href^="/user/"]').first();
      await authorLink.click();
      
      await page.waitForURL(/\/user\//);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/25-profile-from-author.png`,
        fullPage: true 
      });
    });
  });

  // ============================================================================
  // SETTINGS
  // ============================================================================
  test.describe('9. Settings Page', () => {
    test('9.1 Settings page full view', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/26-settings-full.png`,
        fullPage: true 
      });
    });

    test('9.2 Account settings section', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
      await expect(page.getByText('Email address')).toBeVisible();
      await expect(page.getByText('Username')).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/27-settings-account.png` 
      });
    });

    test('9.3 Notification settings', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByRole('heading', { name: 'Email Notifications' })).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/28-settings-notifications.png` 
      });
    });

    test('9.4 Danger zone section', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState('networkidle');
      
      // Scroll to danger zone
      await page.getByText('Danger Zone').scrollIntoViewIfNeeded();
      await expect(page.getByText('Danger Zone')).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/29-settings-danger-zone.png` 
      });
    });
  });

  // ============================================================================
  // SEARCH & FILTER
  // ============================================================================
  test.describe('10. Search and Filter', () => {
    test.beforeEach(async ({ page }) => {
      await loginTestUser(page);
    });

    test('10.1 Search functionality', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.getByPlaceholder('Search');
      await searchInput.fill('Technology');
      await searchInput.press('Enter');
      
      // Allow time for filtering
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/30-search-results.png` 
      });
    });

    test('10.2 Topic filter from sidebar', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Click on a topic button if visible
      const topicButton = page.locator('button:has-text("Programming"), button:has-text("Technology")').first();
      
      if (await topicButton.isVisible()) {
        await topicButton.click();
        await page.waitForTimeout(500);
        
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/31-topic-filter.png` 
        });
      }
    });
  });

  // ============================================================================
  // RESPONSIVE DESIGN
  // ============================================================================
  test.describe('11. Responsive Design', () => {
    test('11.1 Mobile view - Dashboard', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginTestUser(page);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/32-mobile-dashboard.png`,
        fullPage: true 
      });
    });

    test('11.2 Mobile view - Login', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/33-mobile-login.png`,
        fullPage: true 
      });
    });

    test('11.3 Tablet view - Dashboard', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await loginTestUser(page);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/34-tablet-dashboard.png`,
        fullPage: true 
      });
    });

    test('11.4 Mobile view - Post detail', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginTestUser(page);
      await page.waitForLoadState('networkidle');
      
      // Click first post
      await page.locator('article h2').first().click();
      await page.waitForURL(/\/post\//);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/35-mobile-post-detail.png`,
        fullPage: true 
      });
    });

    test('11.5 Mobile Sidebar Toggle', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginTestUser(page);
      
      // Click hamburger menu (first button in header)
      await page.locator('header button').first().click();
      await page.waitForTimeout(500); // Wait for transition
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/35b-mobile-sidebar-open.png` 
      });
    });
  });

  // ============================================================================
  // TOP NAVIGATION
  // ============================================================================
  test.describe('12. Top Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginTestUser(page);
    });

    test('12.1 Top nav bar', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Verify nav elements
      await expect(page.getByText('Minimum').first()).toBeVisible();
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/36-top-nav.png` 
      });
    });

    test('12.2 Write button', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const writeButton = page.getByRole('link', { name: 'Write' });
      
      if (await writeButton.isVisible()) {
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/37-write-button.png` 
        });
      }
    });

    test('12.3 User avatar/menu', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Look for user avatar
      const userAvatar = page.locator('nav img.rounded-full, header img.rounded-full');
      
      if (await userAvatar.first().isVisible()) {
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/38-user-menu.png` 
        });
      }
    });
  });
});
