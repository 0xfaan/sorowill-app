import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { GuardianPanel } from './GuardianPanel';

const meta: Meta<typeof GuardianPanel> = {
  title: 'Components/GuardianPanel',
  component: GuardianPanel,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GuardianPanel>;

const threeGuardians = [
  'GDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'GCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
];

const twoGuardians = [
  'GDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
];

export const NoGuardians: Story = {
  args: {
    guardians: [],
    guardianVotes: 0,
  },
};

export const WithGuardiansNoVotes: Story = {
  args: {
    guardians: threeGuardians,
    guardianVotes: 0,
  },
};

export const OneVote: Story = {
  args: {
    guardians: threeGuardians,
    guardianVotes: 1,
  },
};

export const TwoVotesThresholdMet: Story = {
  args: {
    guardians: twoGuardians,
    guardianVotes: 2,
  },
};

export const GuardianCanVote: Story = {
  args: {
    guardians: threeGuardians,
    guardianVotes: 0,
    isGuardian: true,
    isActive: true,
    onCastVote: fn(),
  },
};

export const GuardianCastingVote: Story = {
  args: {
    guardians: threeGuardians,
    guardianVotes: 0,
    isGuardian: true,
    isActive: true,
    isCastingVote: true,
    onCastVote: fn(),
  },
};

export const GuardianInactiveWill: Story = {
  args: {
    guardians: threeGuardians,
    guardianVotes: 0,
    isGuardian: true,
    isActive: false,
  },
};

export const WithError: Story = {
  args: {
    guardians: threeGuardians,
    guardianVotes: 0,
    isGuardian: true,
    isActive: true,
    onCastVote: fn(),
    error: 'This guardian has already cast a vote for this will.',
  },
};
