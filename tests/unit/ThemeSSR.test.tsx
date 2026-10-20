import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseTheme, themeCookie } from '@/lib/theme';

let cookieValue: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'theme' && cookieValue !== undefined ? { value: cookieValue } : undefined),
  }),
}));
vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getMessages: async () => ({}),
}));
vi.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/app/layout-client', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

import RootLayout from '@/app/layout';

async function renderedTheme(): Promise<unknown> {
  const html = (await RootLayout({ children: null })) as ReactElement<Record<string, unknown>>;
  return html.props['data-theme'];
}

describe('theme SSR (#395)', () => {
  beforeEach(() => {
    cookieValue = undefined;
  });

  it('server-renders the saved theme from the cookie', async () => {
    cookieValue = 'light';
    expect(await renderedTheme()).toBe('light');
    cookieValue = 'dark';
    expect(await renderedTheme()).toBe('dark');
  });

  it('omits data-theme when there is no or an invalid cookie, leaving it to theme-init.js', async () => {
    expect(await renderedTheme()).toBeUndefined();
    cookieValue = 'purple';
    expect(await renderedTheme()).toBeUndefined();
  });

  it('parses and serialises the theme cookie', () => {
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('nope')).toBeUndefined();
    expect(themeCookie('light')).toMatch(/^theme=light; path=\/; max-age=\d+; samesite=lax$/);
  });
});
