import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { CopyAddress } from '@/components/CopyAddress';
import { ToastProvider } from '@/components/Toast';
import messages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

function renderWithProviders(ui: React.ReactElement, locale = 'en', msgs = messages) {
  return render(
    <NextIntlClientProvider locale={locale} messages={msgs}>
      <ToastProvider>{ui}</ToastProvider>
    </NextIntlClientProvider>,
  );
}

describe('CopyAddress clipboard error handling (#220)', () => {
  it('surfaces a toast on clipboard failure', async () => {
    const originalClipboard = navigator.clipboard;
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard failure')),
      },
    });

    renderWithProviders(<CopyAddress address="GA1234567890ABCDEF1234567890ABCDEF1234567890AB" />);

    const copyBtn = screen.getByRole('button', { name: /copy/i });
    copyBtn.click();

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    Object.assign(navigator, { clipboard: originalClipboard });
  });
});

describe('CopyAddress aria-label localization (#668)', () => {
  it('uses the English aria-label from next-intl messages', () => {
    renderWithProviders(
      <CopyAddress address="GA1234567890ABCDEF1234567890ABCDEF1234567890AB" />,
      'en',
      messages,
    );

    expect(
      screen.getByRole('button', { name: 'Copy to clipboard' }),
    ).toBeInTheDocument();
  });

  it('uses the Spanish aria-label from next-intl messages', () => {
    renderWithProviders(
      <CopyAddress address="GA1234567890ABCDEF1234567890ABCDEF1234567890AB" />,
      'es',
      esMessages,
    );

    expect(
      screen.getByRole('button', { name: 'Copiar al portapapeles' }),
    ).toBeInTheDocument();
  });
});