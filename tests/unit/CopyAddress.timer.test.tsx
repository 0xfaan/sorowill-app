import { act, fireEvent, render, screen } from '@testing-library/react';
import { CopyAddress } from '@/components/CopyAddress';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/components/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

const ADDRESS = 'GDBRZV77PZDK7LRBXEUPZNGJNQLFQKAZD6PKS7JFAZAKU4H3FDON4JL4';

async function copy() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button'));
  });
}

describe('CopyAddress reset timer (#316)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears the pending reset timer on unmount', async () => {
    const { unmount } = render(<CopyAddress address={ADDRESS} />);
    await copy();
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('restarts the 2s window on a second copy instead of stacking timers', async () => {
    render(<CopyAddress address={ADDRESS} />);
    await copy();
    act(() => {
      vi.advanceTimersByTime(1_500);
    });
    await copy();
    expect(vi.getTimerCount()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.getByText('Copied!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
  });
});
