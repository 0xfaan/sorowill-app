import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { Footer } from '@/components/Footer';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

vi.mock('@/components/NetworkBadge', () => ({
  NetworkBadge: () => <span data-testid="network-badge">Testnet</span>,
}));

describe('Footer', () => {
  it('renders translated text, labelled nav, and aria-hidden separators in English', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <Footer />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('SoroWill, built on Stellar')).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Footer Navigation' });
    expect(nav).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/SoroWill/sorowill-app',
    );
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Changelog' })).toHaveAttribute('href', '/changelog');
    expect(screen.getByRole('link', { name: 'Stats' })).toHaveAttribute('href', '/stats');
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
    expect(screen.getByText('MIT License')).toBeInTheDocument();

    // Verify all bullet separators are aria-hidden so screen readers ignore them
    const bullets = container.querySelectorAll('span[aria-hidden="true"]');
    expect(bullets.length).toBe(6);
    bullets.forEach((bullet) => {
      expect(bullet.textContent).toBe('•');
    });
  });

  it('renders Footer under the es locale and finds the Spanish strings', () => {
    render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <Footer />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('SoroWill, construido en Stellar')).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Navegación del pie de página' });
    expect(nav).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Términos de Uso' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Política de Privacidad' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Registro de Cambios' })).toHaveAttribute('href', '/changelog');
    expect(screen.getByRole('link', { name: 'Estadísticas' })).toHaveAttribute('href', '/stats');
    expect(screen.getByRole('link', { name: 'Preguntas Frecuentes' })).toHaveAttribute('href', '/faq');
    expect(screen.getByText('Licencia MIT')).toBeInTheDocument();
  });
});
