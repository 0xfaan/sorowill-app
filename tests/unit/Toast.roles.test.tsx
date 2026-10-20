import { fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/Toast';

function Trigger() {
  const toast = useToast();
  return (
    <>
      <button type="button" onClick={() => toast.error('Payment failed')}>
        error
      </button>
      <button type="button" onClick={() => toast.success('Will created')}>
        success
      </button>
      <button type="button" onClick={() => toast.info('Heads up')}>
        info
      </button>
    </>
  );
}

function renderWithToasts() {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  );
}

describe('Toast roles per variant (#314)', () => {
  it('announces error toasts as alerts named by their message', () => {
    renderWithToasts();
    fireEvent.click(screen.getByRole('button', { name: 'error' }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Payment failed');
    expect(alert).not.toHaveAttribute('aria-label');
  });

  it.each([
    ['success', 'Will created'],
    ['info', 'Heads up'],
  ])('announces %s toasts politely as status', (variant, message) => {
    renderWithToasts();
    fireEvent.click(screen.getByRole('button', { name: variant }));

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(message);
    expect(status).not.toHaveAttribute('aria-label');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Toast decorative icons are hidden from screen readers (#669)', () => {
  it.each([
    ['error', 'Payment failed', '✕'],
    ['success', 'Will created', '✓'],
    ['info', 'Heads up', 'ℹ'],
  ])('marks the %s variant icon as aria-hidden', (variant, message, glyph) => {
    const { container } = render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: variant }));

    const toast = container.querySelector('[role="alert"], [role="status"]');
    expect(toast).not.toBeNull();
    expect(toast).toHaveTextContent(message);

    const iconSpans = Array.from(toast!.querySelectorAll('span')).filter(
      (span) => span.textContent?.trim() === glyph,
    );
    expect(iconSpans).toHaveLength(1);

    const icon = iconSpans[0];
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).not.toHaveAttribute('role', 'button');
    expect(icon.closest('button')).toBeNull();
  });
});