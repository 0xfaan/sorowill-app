import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';

function stubPrefersDark(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: prefersDark,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  );
}

describe('ThemeProvider (#320)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('ignores an invalid stored theme and falls back to the OS preference', () => {
    stubPrefersDark(false);
    localStorage.setItem('theme', 'blue');

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('writes the toggled theme exactly once under StrictMode', () => {
    stubPrefersDark(true);
    document.documentElement.setAttribute('data-theme', 'dark');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <StrictMode>
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>
      </StrictMode>,
    );
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(setItem.mock.calls.filter(([key]) => key === 'theme')).toEqual([['theme', 'light']]);
  });
});
