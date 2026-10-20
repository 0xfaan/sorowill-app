import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { WillStatus, type Will } from '@sorowill/sdk';
import { WillCard } from './WillCard';

function makeWill(overrides: Partial<Will> = {}): Will {
  return {
    id: '42',
    owner: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    token: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    balance: '1000000000', // 1000 USDC (7 decimals)
    beneficiaries: [
      { address: 'GDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', percentage: 60 },
      { address: 'GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', percentage: 40 },
    ],
    guardians: ['GCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
    guardianVotes: 0,
    status: WillStatus.Active,
    checkinPeriodDays: 90,
    gracePeriodDays: 7,
    lastCheckin: new Date(Date.now() - 30 * 86_400_000), // 30 days ago
    triggerTime: null,
    ...overrides,
  };
}

const meta: Meta<typeof WillCard> = {
  title: 'Components/WillCard',
  component: WillCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WillCard>;

export const ActiveWithCheckIn: Story = {
  args: {
    will: makeWill(),
    onCheckIn: fn(),
    checkingIn: false,
  },
};

export const ActiveNearDeadline: Story = {
  args: {
    will: makeWill({ lastCheckin: new Date(Date.now() - 88 * 86_400_000) }),
    onCheckIn: fn(),
  },
};

export const ActiveOverdue: Story = {
  args: {
    will: makeWill({ lastCheckin: new Date(Date.now() - 95 * 86_400_000) }),
    onCheckIn: fn(),
  },
};

export const CheckingIn: Story = {
  args: {
    will: makeWill(),
    onCheckIn: fn(),
    checkingIn: true,
  },
};

export const Triggered: Story = {
  args: {
    will: makeWill({
      status: WillStatus.Triggered,
      triggerTime: new Date(Date.now() - 2 * 86_400_000),
    }),
  },
};

export const Released: Story = {
  args: {
    will: makeWill({ status: WillStatus.Released }),
  },
};

export const Cancelled: Story = {
  args: {
    will: makeWill({ status: WillStatus.Cancelled }),
  },
};

export const WithoutCheckInButton: Story = {
  args: {
    will: makeWill(),
  },
};
