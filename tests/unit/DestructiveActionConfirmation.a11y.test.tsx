import { fireEvent, render, screen } from '@testing-library/react';
import { DestructiveActionConfirmation } from '@/components/DestructiveActionConfirmation';

function renderModal(isOpen: boolean, onCancel = vi.fn()) {
  render(
    <DestructiveActionConfirmation isOpen={isOpen} action="cancel_will" willId="42" onConfirm={vi.fn()} onCancel={onCancel} />,
  );
  return onCancel;
}

describe('DestructiveActionConfirmation modal semantics (#305)', () => {
  it('is an aria-modal dialog named by its heading', () => {
    renderModal(true);
    const dialog = screen.getByRole('dialog', { name: 'Cancel this will' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onCancel when Escape is pressed', () => {
    const onCancel = renderModal(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape while closed', () => {
    const onCancel = renderModal(false);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
  });
});
