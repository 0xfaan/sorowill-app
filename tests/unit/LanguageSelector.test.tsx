import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LanguageSelector, isSupportedLocale } from '@/components/LanguageSelector';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

describe('LanguageSelector (#84, #242, #249, #254)', () => {
  it('renders language switch buttons for EN and ES', () => {
    render(<LanguageSelector />);
    expect(screen.getByRole('button', { name: /switch to english/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /switch to español/i })).toBeInTheDocument();
  });

  it('sets NEXT_LOCALE cookie and reloads the document on switch', () => {
    render(<LanguageSelector />);
    const esButton = screen.getByRole('button', { name: /switch to español/i });
    const mockReload = vi.fn();
    const windowWithMockReload = new Proxy(window, {
      get(target, property) {
        if (property === 'location') return { reload: mockReload };
        return Reflect.get(target, property, target);
      },
    });
    vi.stubGlobal('window', windowWithMockReload);

    try {
      fireEvent.click(esButton);

      expect(document.cookie).toContain('NEXT_LOCALE=es');
      expect(mockReload).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('only treats locales from the i18n supported list as valid (#393)', () => {
    expect(isSupportedLocale('en')).toBe(true);
    expect(isSupportedLocale('es')).toBe(true);
    expect(isSupportedLocale('xx')).toBe(false);
    expect(isSupportedLocale('')).toBe(false);
    expect(isSupportedLocale(undefined)).toBe(false);
  });

  it('silently replaces an unsupported persisted locale with en (#393)', () => {
    document.cookie = 'NEXT_LOCALE=xx; path=/';
    render(<LanguageSelector />);
    expect(document.cookie).toContain('NEXT_LOCALE=en');
    expect(document.cookie).not.toContain('NEXT_LOCALE=xx');
  });

  it('leaves a supported persisted locale untouched (#393)', () => {
    document.cookie = 'NEXT_LOCALE=es; path=/';
    render(<LanguageSelector />);
    expect(document.cookie).toContain('NEXT_LOCALE=es');
  });
});
