import { test, expect } from '@playwright/test';

/**
 * Visual-regression snapshots are generated against a production build
 * (`next build && next start`) served by Playwright's `webServer`, not the
 * Next.js dev server. Dev mode differs from production (unminified bundles,
 * double-invoked effects, dev-only overlays, different CSS/JS bundling), so
 * baselines must be captured from the production build to avoid false
 * positives/negatives that never reproduce in the deployed app.
 *
 * To regenerate the production baseline locally:
 *   npm run build && npx playwright test tests/e2e/visual-regression.spec.ts --update-snapshots
 */

test.describe('visual regression', () => {
  test('home page matches production baseline', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('home.png', {
      fullPage: true,
      // Allow minor anti-aliasing differences across environments while still
      // catching real layout/rendering regressions from the production build.
      maxDiffPixelRatio: 0.01,
    });
  });
});
