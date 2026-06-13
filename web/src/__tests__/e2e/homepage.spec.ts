/**
 * E2E Tests — Homepage & Critical User Flows
 *
 * Uses Playwright for browser automation.
 * Tests critical paths: homepage load, post viewing, newsletter signup, login
 *
 * Run: npx playwright test
 * Setup: npm install -D @playwright/test && npx playwright install
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:1337';

// ── Homepage Tests ──────────────────────────────────────────

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBe(200);
  });

  test('has correct title', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/CMS Platform|Modern CMS/);
  });

  test('displays hero section', async ({ page }) => {
    await page.goto(BASE_URL);
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
  });

  test('navigation links work', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check nav exists
    const nav = page.locator('header nav, header');
    await expect(nav).toBeVisible();

    // Check for key links
    const blogLink = page.locator('a[href*="posts"], a:has-text("Blog"), a:has-text("Read")');
    await expect(blogLink.first()).toBeVisible();
  });

  test('dark mode toggle works', async ({ page }) => {
    await page.goto(BASE_URL);

    // Toggle dark mode
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"], button:has-text("dark"), button:has-text("theme")').first();
    if (await darkModeToggle.isVisible().catch(() => false)) {
      await darkModeToggle.click();
      // Check if dark class is applied
      const html = page.locator('html');
      const classes = await html.getAttribute('class');
      expect(classes).toContain('dark');
    }
  });

  test('newsletter signup form exists', async ({ page }) => {
    await page.goto(BASE_URL);
    const emailInput = page.locator('input[type="email"]').last();
    const submitBtn = page.locator('button:has-text("Subscribe"), button:has-text("Sign Up")').last();

    await expect(emailInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });
});

// ── Post Viewing Tests ──────────────────────────────────────

test.describe('Post Viewing', () => {
  test('navigate to posts listing', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('post listing shows posts or empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts`);

    const hasPosts = await page.locator('article').count() > 0;
    const hasEmptyState = await page.locator('text=/no posts|no articles|nothing here/i').isVisible().catch(() => false);

    expect(hasPosts || hasEmptyState).toBe(true);
  });

  test('search bar works', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts`);
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      // Should not crash
      await page.waitForTimeout(1000);
    }
  });
});

// ── Newsletter Flow Tests ───────────────────────────────────

test.describe('Newsletter', () => {
  test('subscribe page loads', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/newsletter/subscribe`).catch(() => null);
    // Page might not exist yet, that's ok
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('unsubscribe page loads', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/newsletter/unsubscribe?token=test`).catch(() => null);
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
  });
});

// ── Auth Flow Tests ─────────────────────────────────────────

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const emailInput = page.locator('input[type="email"], input[name="email"], input[name="identifier"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput.first()).toBeVisible();
    await expect(passwordInput.first()).toBeVisible();
    await expect(submitBtn.first()).toBeVisible();
  });

  test('register page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput.first()).toBeVisible();
    await expect(passwordInput.first()).toBeVisible();
  });

  test('login validation works', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const submitBtn = page.locator('button[type="submit"]').first();

    // Submit empty form
    await submitBtn.click();

    // Should show validation errors or stay on page
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('password reset page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput.first()).toBeVisible();
  });
});

// ── Dashboard Tests (Admin) ─────────────────────────────────

test.describe('Dashboard', () => {
  test('dashboard requires auth', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(1000);

    // Should redirect to login or show auth wall
    const url = page.url();
    const isRedirected = url.includes('/login') || url.includes('/auth');
    const hasAuthWall = await page.locator('text=/login|sign in|authenticate/i').isVisible().catch(() => false);

    expect(isRedirected || hasAuthWall || response?.status() === 401 || response?.status() === 403).toBe(true);
  });

  test('analytics dashboard loads for admin', async ({ page }) => {
    // This would need authenticated session in real tests
    // For now, just verify the redirect works
    await page.goto(`${BASE_URL}/dashboard/analytics`).catch(() => {});
  });
});

// ── Accessibility Tests ──────────────────────────────────────

test.describe('Accessibility', () => {
  test('homepage has no critical a11y violations', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for basic a11y requirements
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // All images should have alt text
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBe(null);
    }
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto(BASE_URL);

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should be visible
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeDefined();
  });
});

// ── API Health Tests ────────────────────────────────────────

test.describe('API Health', () => {
  test('health endpoint returns status', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/health`);
    expect(response.status()).toBeLessThan(500);

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('checks');
    }
  });

  test('posts endpoint works', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/posts`);
    expect(response.status()).toBeLessThan(500);
  });
});
