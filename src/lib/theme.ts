export type Theme = 'light' | 'dark';

/** Cookie (and localStorage key) carrying the saved theme so the server can render it. */
export const THEME_COOKIE = 'theme';

/** Returns the value if it is a valid theme, otherwise undefined. */
export function parseTheme(value: string | null | undefined): Theme | undefined {
  return value === 'light' || value === 'dark' ? value : undefined;
}

/** `document.cookie` assignment persisting the theme for one year (kept in sync with public/theme-init.js). */
export function themeCookie(theme: Theme): string {
  return `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}
