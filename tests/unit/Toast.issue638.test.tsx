import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { ToastProvider, useToast } from '@/components/Toast';

function Scene() {
  const toast = useToast();
  const [count, setCount] = useState(0);

  return (
    <>
      <button type="button" onClick={() => toast.info('Persistent toast')}>
        add
      </button>
      {/* Unrelated parent re-render, driven by state that has nothing to
          do with the toast itself. */}
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        bump
      </button>
      <span data-testid="count">{count}</span>
    </>
  );
}

// Regression coverage for #638: ToastItem's dismiss timer is keyed off
// [toast.id, onDismiss]. An unrelated re-render of the parent (e.g. other
// app state changing) must not restart the timer -- otherwise a toast
// could be kept alive indefinitely by unrelated activity.
describe('ToastItem dismiss timer vs unrelated re-renders (#638)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('still dismisses on schedule even when the parent re-renders for unrelated reasons', () => {
    render(
      <ToastProvider>
        <Scene />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('add'));

    // Advance partway, then force several unrelated parent re-renders.
    act(() => {
      vi.advanceTimersByTime(3_500);
    });
    fireEvent.click(screen.getByText('bump'));
    fireEvent.click(screen.getByText('bump'));
    fireEvent.click(screen.getByText('bump'));
    expect(screen.getByTestId('count').textContent).toBe('3');

    // If the timer had been restarted by those re-renders, the toast would
    // still be present here. It should have fired on the original schedule.
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.queryByText('Persistent toast')).not.toBeInTheDocument();
  });
});
