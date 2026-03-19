import { Page, BrowserContext } from '@playwright/test';

/**
 * Auth utilities for E2E tests
 *
 * Since Ready2Spray uses OAuth for authentication, we have two testing approaches:
 * 1. For unauthenticated flows: Test landing page, public routes
 * 2. For authenticated flows: Use stored auth state from a setup script
 */

// Storage state file for authenticated sessions
export const AUTH_STATE_FILE = 'e2e/.auth/user.json';

/**
 * Check if user is redirected to login
 */
export async function expectRedirectToLogin(page: Page) {
  // OAuth redirects to external portal
  await page.waitForURL(/oauth|login|signIn/, { timeout: 10000 });
}

/**
 * Check if user is on authenticated dashboard
 */
export async function expectOnDashboard(page: Page) {
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Navigate and verify landing page loads
 */
export async function goToLandingPage(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

/**
 * Click sign in button on landing page
 */
export async function clickSignIn(page: Page) {
  const signInButton = page.getByRole('button', { name: /sign in/i });
  await signInButton.click();
}

/**
 * Click sign up / get started button
 */
export async function clickSignUp(page: Page) {
  const signUpButton = page.getByRole('button', { name: /sign up|get started/i }).first();
  await signUpButton.click();
}

/**
 * For authenticated tests, load stored auth state
 * Run `pnpm test:e2e:setup-auth` first to create auth state
 */
export async function useAuthenticatedContext(context: BrowserContext) {
  try {
    await context.storageState({ path: AUTH_STATE_FILE });
  } catch (error) {
    console.warn('No auth state found. Run auth setup first.');
  }
}

/**
 * Logout by clearing storage
 */
export async function logout(page: Page) {
  // Click user menu and logout
  const userMenu = page.locator('[data-testid="user-menu"]');
  if (await userMenu.isVisible()) {
    await userMenu.click();
    const logoutButton = page.locator('[data-testid="logout-button"]');
    await logoutButton.click();
  }
}
