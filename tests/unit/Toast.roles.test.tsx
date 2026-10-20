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
