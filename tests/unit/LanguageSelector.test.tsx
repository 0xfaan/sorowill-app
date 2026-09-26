import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LanguageSelector } from '@/components/LanguageSelector';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

describe('LanguageSelector (#84, #242, #249, #254)', () => {
  it('renders language switch buttons for EN and ES', () => {
    render(<LanguageSelector />);
    expect(screen.getByRole('button', { name: /switch to english/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /switch to español/i })).toBeInTheDocument();
  });

  it('sets NEXT_LOCALE cookie and refreshes router on switch', () => {
    render(<LanguageSelector />);
    const esButton = screen.getByRole('button', { name: /switch to español/i });
    fireEvent.click(esButton);

    expect(document.cookie).toContain('NEXT_LOCALE=es');
    expect(mockRefresh).toHaveBeenCalled();
  });
});
