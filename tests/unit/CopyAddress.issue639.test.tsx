import { act, fireEvent, render, screen } from '@testing-library/react';
import { CopyAddress } from '@/components/CopyAddress';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/components/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

const ADDRESS = 'GDBRZV77PZDK7LRBXEUPZNGJNQLFQKAZD6PKS7JFAZAKU4H3FDON4JL4';

async function click() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button'));
  });
}

// Regression coverage for #639: rapid repeated clicks must never leave more
// than one pending reset timer, and an unmount mid-flight must not let a
// stale timer fire later (which would otherwise throw/act-warn or flip
// `copied` state on an unmounted component).
describe('CopyAddress rapid clicks and unmount (#639)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('collapses rapid repeated clicks into a single pending timer, not one per click', async () => {
    render(<CopyAddress address={ADDRESS} />);

    await click();
    await click();
    await click();
    await click();

    expect(vi.getTimerCount()).toBe(1);
  });

  it('does not fire a leaked timer after unmount following a click', async () => {
    const { unmount } = render(<CopyAddress address={ADDRESS} />);

    await click();
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);

    // Advancing time after unmount must be a no-op: nothing left to fire,
    // and no React state update on an unmounted component.
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(5_000);
      });
    }).not.toThrow();
  });
});
