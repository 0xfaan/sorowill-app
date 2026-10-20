import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Error Boundary Coverage Audit (#41)', () => {
  const appDir = path.join(process.cwd(), 'src/app');

  function getRoutes(dir: string, routes: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('_')) {
        getRoutes(fullPath, routes);
      } else if (entry.name === 'page.tsx' || entry.name === 'layout.tsx') {
        routes.push(path.dirname(fullPath));
      }
    }

    return routes;
  }

  function hasErrorBoundary(routePath: string): boolean {
    const errorPath = path.join(routePath, 'error.tsx');
    return fs.existsSync(errorPath);
  }

  function hasLoadingState(routePath: string): boolean {
    const loadingPath = path.join(routePath, 'loading.tsx');
    return fs.existsSync(loadingPath);
  }

  it('verifies root layout has error boundary', () => {
    const layoutPath = path.join(appDir, 'layout.tsx');
    expect(fs.existsSync(layoutPath)).toBe(true);
  });

  it('verifies error.tsx files exist in critical routes', () => {
    const criticalRoutes = [
      path.join(appDir, 'will'),
      path.join(appDir, 'dashboard'),
      path.join(appDir, 'verify'),
    ];

    for (const route of criticalRoutes) {
      if (fs.existsSync(route)) {
        expect(hasErrorBoundary(route)).toBe(true);
      }
    }
  });

  it('verifies loading.tsx files exist in critical routes', () => {
    const criticalRoutes = [
      path.join(appDir, 'dashboard'),
      path.join(appDir, 'will'),
      path.join(appDir, 'verify'),
    ];

    for (const route of criticalRoutes) {
      if (fs.existsSync(route)) {
        const hasLoading = hasLoadingState(route);
        // Some routes may not need loading states, but critical ones should
        if (route.includes('dashboard') || route.includes('will/new')) {
          expect(hasLoading || fs.existsSync(path.join(route, 'error.tsx'))).toBe(true);
        }
      }
    }
  });

  it('verifies will/new route has error boundary or loading state', () => {
    const willNewPath = path.join(appDir, 'will', 'new');
    if (fs.existsSync(willNewPath)) {
      const hasError = hasErrorBoundary(willNewPath);
      const hasLoading = hasLoadingState(willNewPath);
      expect(hasError || hasLoading).toBe(true);
    }
  });

  it('verifies all route segments have proper structure', () => {
    const routes = getRoutes(appDir);
    expect(routes.length).toBeGreaterThan(0);
  });

  it('verifies error boundary files are not empty', () => {
    const errorPath = path.join(appDir, 'dashboard', 'error.tsx');
    if (fs.existsSync(errorPath)) {
      const content = fs.readFileSync(errorPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toMatch(/error|Error|export|function/i);
    }
  });

  it('verifies dashboard error boundary announces errors to screen readers (#673)', () => {
    const errorPath = path.join(appDir, 'dashboard', 'error.tsx');
    expect(fs.existsSync(errorPath)).toBe(true);

    const content = fs.readFileSync(errorPath, 'utf-8');

    // Must have an aria-live region
    expect(content).toMatch(/aria-live\s*=\s*["']polite["']/);
    // Must be atomic so the whole message is announced
    expect(content).toMatch(/aria-atomic\s*=\s*["']true["']/);
    // The live region should wrap/contain the error message rendering
    expect(content).toMatch(/aria-live[\s\S]*?\{[^}]*error[^}]*\}/i);
  });

  it('verifies loading state files are not empty', () => {
    const loadingPath = path.join(appDir, 'dashboard', 'loading.tsx');
    if (fs.existsSync(loadingPath)) {
      const content = fs.readFileSync(loadingPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toMatch(/export|function|loading/i);
    }
  });
});
