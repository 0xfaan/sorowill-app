import { classifyError } from '@/components/WalletConnect';

describe('WalletConnect classifyError (#323)', () => {
  it('classifies an explicit not-installed error', () => {
    expect(classifyError(new Error('Freighter is not installed')).type).toBe('not_installed');
  });

  it('classifies a declined request as user_declined even when it mentions Freighter', () => {
    expect(classifyError(new Error('User declined access in Freighter')).type).toBe('user_declined');
    expect(classifyError(new Error('Request rejected')).type).toBe('user_declined');
  });

  it("does not treat 'Account not found' as a missing wallet", () => {
    expect(classifyError(new Error('Account not found')).type).toBe('generic');
  });

  it('classifies other errors as generic', () => {
    expect(classifyError(new Error('Network request failed')).type).toBe('generic');
    expect(classifyError('something odd').type).toBe('generic');
  });
});
