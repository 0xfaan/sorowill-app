import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast } from '@/components/Toast';

function TestConsumer() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success('Success message')}>Add Success</button>
      <button onClick={() => toast.error('Error message')}>Add Error</button>
      <button onClick={() => toast.info('Info message')}>Add Info</button>
    </div>
  );
}

describe('Toast notification system (#18, #197, #212, #220, #241)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('asserts exactly one dismiss timer exists per toast instance (#212)', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    const initialTimerCalls = setTimeoutSpy.mock.calls.length;

    act(() => {
      screen.getByText('Add Success').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();
    // Exactly 1 new timer scheduled for the toast auto-dismiss
    const timerCallsAfterToast = setTimeoutSpy.mock.calls.length - initialTimerCalls;
    expect(timerCallsAfterToast).toBe(1);

    setTimeoutSpy.mockRestore();
  });

  it('auto-dismisses toast after 4000ms', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('Add Error').click();
    });

    expect(screen.getByText('Error message')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
  });

  it('allows manual dismiss of toast', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('Add Info').click();
    });

    expect(screen.getByText('Info message')).toBeInTheDocument();

    const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
    act(() => {
      dismissButton.click();
    });

    expect(screen.queryByText('Info message')).not.toBeInTheDocument();
  });
});
