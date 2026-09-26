import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/Toast';

function Trigger() {
  const toast = useToast();
  return (
    <>
      <button type="button" onClick={() => toast.info('Toast A')}>
        add A
      </button>
      <button type="button" onClick={() => toast.info('Toast B')}>
        add B
      </button>
    </>
  );
}

describe('ToastItem auto-dismiss timer (#313)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dismisses a toast ~4s after it was created even when another toast arrives', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('add A'));
    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    fireEvent.click(screen.getByText('add B'));
    act(() => {
      vi.advanceTimersByTime(1_100);
    });

    expect(screen.queryByText('Toast A')).not.toBeInTheDocument();
    expect(screen.getByText('Toast B')).toBeInTheDocument();
  });
});
