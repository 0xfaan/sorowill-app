import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import type { Beneficiary } from '@sorowill/sdk';
import { BeneficiaryForm } from './BeneficiaryForm';

const meta: Meta<typeof BeneficiaryForm> = {
  title: 'Components/BeneficiaryForm',
  component: BeneficiaryForm,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BeneficiaryForm>;

const singleBeneficiary: Beneficiary[] = [
  { address: 'GDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', percentage: 100 },
];

const twoBeneficiaries: Beneficiary[] = [
  { address: 'GDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', percentage: 50 },
  { address: 'GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', percentage: 50 },
];

const threeBeneficiaries: Beneficiary[] = [
  { address: 'GDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', percentage: 40 },
  { address: 'GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', percentage: 35 },
  { address: 'GCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', percentage: 25 },
];

const invalidTotal: Beneficiary[] = [
  { address: 'GDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', percentage: 40 },
  { address: 'GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', percentage: 30 },
];

const allEmpty: Beneficiary[] = [
  { address: '', percentage: 0 },
];

export const Empty: Story = {
  args: {
    value: [],
    onChange: fn(),
  },
};

export const SingleBeneficiary: Story = {
  args: {
    value: singleBeneficiary,
    onChange: fn(),
  },
};

export const TwoBeneficiariesEqual: Story = {
  args: {
    value: twoBeneficiaries,
    onChange: fn(),
  },
};

export const ThreeBeneficiaries: Story = {
  args: {
    value: threeBeneficiaries,
    onChange: fn(),
  },
};

export const InvalidTotal: Story = {
  args: {
    value: invalidTotal,
    onChange: fn(),
  },
};

export const EmptyAddress: Story = {
  args: {
    value: allEmpty,
    onChange: fn(),
  },
};
