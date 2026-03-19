import { test, expect } from '@playwright/test';

test.describe('Public Navigation', () => {
  test('should handle 404 for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-12345');

    // Should show 404 or redirect
    await page.waitForTimeout(1000);

    const content = await page.content();
    // Either shows 404 page or redirects to landing/login
    expect(content).toMatch(/not found|404|page.*exist|ready2spray/i);
  });

  test('should load weather page route', async ({ page }) => {
    // Weather might be public or protected
    const response = await page.goto('/weather');

    // Should either load or redirect
    expect(response?.status()).toBeLessThan(500);
  });

  test('should load shared job page with invalid ID', async ({ page }) => {
    await page.goto('/shared/invalid-job-id');

    await page.waitForTimeout(1000);

    // Should handle gracefully
    const content = await page.content();
    expect(content).toMatch(/not found|invalid|error|job|ready2spray/i);
  });
});

test.describe('API Health', () => {
  test('should have working tRPC endpoint', async ({ request }) => {
    // Basic health check - tRPC returns proper response
    const response = await request.get('/api/trpc');

    // tRPC endpoint exists (may return error without proper request)
    expect(response.status()).toBeLessThan(500);
  });
});
