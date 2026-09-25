import { render, screen } from '@testing-library/react';
import { BeneficiaryForm } from '@/components/BeneficiaryForm';

describe('BeneficiaryForm address error semantics (#328)', () => {
  it('marks an invalid address with aria-invalid and links the alert message', () => {
    render(<BeneficiaryForm value={[{ address: 'INVALID', percentage: 100 }]} onChange={vi.fn()} />);

    const input = screen.getByLabelText('Beneficiary 1 address');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Invalid Stellar address');
    expect(input).toHaveAttribute('aria-describedby', alert.id);
  });

  it('leaves a valid address unmarked', () => {
    render(
      <BeneficiaryForm
        value={[{ address: 'GDBRZV77PZDK7LRBXEUPZNGJNQLFQKAZD6PKS7JFAZAKU4H3FDON4JL4', percentage: 100 }]}
        onChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Beneficiary 1 address');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});
