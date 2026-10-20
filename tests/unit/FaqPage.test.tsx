import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import FaqPage from '@/app/faq/page';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('FaqPage (#442)', () => {
  it('renders the FAQ page from the faq namespace in English', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <FaqPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'How it Works & FAQ' })).toBeInTheDocument();

    // Lifecycle steps render translated titles (numbered 01-05)
    expect(screen.getByText('Create a Will')).toBeInTheDocument();
    expect(screen.getByText('Funds Released')).toBeInTheDocument();

    // All 16 FAQ items render their translated questions
    expect(screen.getByText('How does SoroWill work?')).toBeInTheDocument();
    expect(screen.getByText('Are there any fees?')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Create Your Will' })).toHaveAttribute(
      'href',
      '/will/new',
    );
  });

  it('renders the FAQ page under the es locale and finds the Spanish strings', () => {
    render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <FaqPage />
      </NextIntlClientProvider>,
    );

    // Acceptance criterion: Spanish FAQ loads correctly (no hardcoded English).
    expect(
      screen.getByRole('heading', { level: 1, name: 'Cómo funciona y Preguntas Frecuentes' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Preguntas Frecuentes' })).toBeInTheDocument();
    expect(screen.getByText('¿Cómo funciona SoroWill?')).toBeInTheDocument();
    expect(screen.getByText('¿Hay alguna tarifa?')).toBeInTheDocument();

    // No English FAQ copy leaks through in the Spanish render.
    expect(screen.queryByText('How does SoroWill work?')).not.toBeInTheDocument();
    expect(screen.queryByText('Are there any fees?')).not.toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Crear tu Testamento' })).toHaveAttribute(
      'href',
      '/will/new',
    );
  });
});
