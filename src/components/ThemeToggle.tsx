'use client';

import { useOptionalTheme } from './ThemeProvider';

export function ThemeToggle() {
  const themeContext = useOptionalTheme();

  // Rendered outside a ThemeProvider (or before it is available): show an inert
  // placeholder instead of throwing and taking the whole header down.
  if (!themeContext) {
    return (
      <button
        type="button"
        disabled
        aria-label="Theme loading"
        className="rounded-lg border border-white/20 px-3 py-2 text-sm text-will-light/40"
      >
        —
      </button>
    );
  }

  const { theme, toggleTheme } = themeContext;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="rounded-lg border border-white/20 px-3 py-2 text-sm text-will-light/70 transition hover:border-white/40 hover:text-will-light"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
