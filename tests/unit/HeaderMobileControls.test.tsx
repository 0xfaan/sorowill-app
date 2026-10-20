import { render, screen } from '@testing-library/react';
import ClientLayout from '@/app/layout-client';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/components/WalletConnect', () => ({
  WalletConnect: () => <div data-testid="wallet-connect" />,
}));
vi.mock('@/components/NetworkMismatchBanner', () => ({
  NetworkMismatchBanner: () => null,
}));
vi.mock('@/components/NetworkSwitcher', () => ({
  NetworkSwitcher: () => <div data-testid="network-switcher" />,
}));
vi.mock('@/components/LanguageSelector', () => ({
  LanguageSelector: () => <div data-testid="language-selector" />,
}));
vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));
vi.mock('@/components/Toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/** True when `el` or an ancestor is hidden below the `sm` breakpoint. */
function hiddenOnMobile(el: HTMLElement): boolean {
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (node.classList.contains('hidden')) return true;
  }
  return false;
}

describe('header controls on mobile widths (#319)', () => {
  it('keeps wallet, network, language and theme controls outside the sm-only nav', () => {
    render(
      <ClientLayout>
        <div />
      </ClientLayout>,
    );

    for (const id of ['wallet-connect', 'network-switcher', 'language-selector', 'theme-toggle']) {
      expect(hiddenOnMobile(screen.getByTestId(id))).toBe(false);
    }
  });
});
