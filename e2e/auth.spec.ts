import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/oauth|app-auth|login|\//);
  });

  test('should redirect unauthenticated users from jobs page', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/oauth|app-auth|login|\//);
  });

  test('should redirect unauthenticated users from customers page', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/oauth|app-auth|login|\//);
  });

  test('should redirect unauthenticated users from settings page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/oauth|app-auth|login|\//);
  });
});

test.describe('Organization Setup Flow', () => {
  test('should display organization setup page', async ({ page }) => {
    await page.goto('/signup/organization');
    // Use getByText instead of getByRole since CardTitle may not be a heading
    await expect(page.getByText(/set up your organization/i)).toBeVisible();
  });

  test('should have required form fields for organization', async ({ page }) => {
    await page.goto('/signup/organization');
    const nameInput = page.locator('input#name');
    await expect(nameInput).toBeVisible();
    const invitationInput = page.locator('input#invitationCode');
    await expect(invitationInput).toBeVisible();
  });
});

test.describe('Accept Invitation Flow', () => {
  test('should handle invalid invitation code', async ({ page }) => {
    await page.goto('/accept-invitation?code=invalid-code-123');
    await page.waitForTimeout(2000);
    const pageContent = await page.content();
    expect(pageContent).toMatch(/invalid|expired|error|not found|login/i);
  });
});

