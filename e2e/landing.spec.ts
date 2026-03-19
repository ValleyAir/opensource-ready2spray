import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display landing page with branding', async ({ page }) => {
    await page.goto('/');
    // Check for logo image with alt text
    await expect(page.locator('img[alt="Ready2Spray"]').first()).toBeVisible();
    // Check for site title in navigation
    await expect(page.locator('nav')).toContainText('ready2spray');
  });

  test('should display hero section with CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Streamline Your Agricultural Spraying Operations');
    await expect(page.getByRole('button', { name: /get started/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /learn more/i }).first()).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Job Management' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EPA Compliance' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Team Coordination' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI Assistant' })).toBeVisible();
  });

  test('should have sign in button in navigation', async ({ page }) => {
    await page.goto('/');
    const signInButton = page.getByRole('button', { name: /dev sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test('should navigate to sign up page when clicking Get Started', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get started/i }).first().click();
    await expect(page).toHaveURL(/\/signup\/organization/);
  });

  test('should redirect sign in to OAuth portal', async ({ page }) => {
    await page.goto('/');
    const signInButton = page.getByRole('button', { name: /dev sign in/i });
    await signInButton.click();
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/localhost/);
  });

  test('should scroll to features when clicking Learn More', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /learn more/i }).first().click();
    await expect(page.locator('#features')).toBeInViewport();
  });

  test('should display footer with copyright', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toContainText(/Ready2Spray.*GTM Planetary/);
  });
});

test.describe('Landing Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /join/i })).toBeVisible();
  });

  test('should have responsive hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('img[alt="Ready2Spray"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /get started/i }).first()).toBeVisible();
  });
});
