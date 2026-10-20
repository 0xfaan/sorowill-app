import { type Will } from '@sorowill/sdk';

import { formatTokenBalance } from '@/lib/tokenDecimals';

function isValidBeneficiaryAddress(address: unknown): boolean {
  return typeof address === 'string' && address.trim().length > 0;
}

/**
 * Validates that every will's beneficiaries have a non-empty address before
 * they are written into the CSV export. An empty address would otherwise
 * silently drop a field and shift/corrupt the CSV row.
 */
export function validateBeneficiariesForExport(wills: Will[]): void {
  wills.forEach((will) => {
    const beneficiaries = Array.isArray(will.beneficiaries) ? will.beneficiaries : [];
    beneficiaries.forEach((b) => {
      const address = typeof b === 'string' ? b : (b as { address?: unknown })?.address;
      if (!isValidBeneficiaryAddress(address)) {
        throw new Error(`Will ${will.id ?? '<unknown>'} has a beneficiary with an invalid or empty address`);
      }
    });
  });
}

function escapeCSVField(val: string | number | bigint | null | undefined): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats a will's balance for CSV export. A zero or missing balance is always
 * written as `0` regardless of how it is represented (`0n`, `'0'`, `''`),
 * rather than sometimes `0` and sometimes `0.0000000` (#699). A malformed
 * balance is written as an empty cell instead of aborting the whole export.
 */
function formatExportBalance(balance: Will['balance'] | null | undefined, token: string): string {
  if (balance === null || balance === undefined || balance === '') return '0';
  let raw: bigint;
  try {
    raw = BigInt(balance);
  } catch {
    return '';
  }
  if (raw === 0n) return '0';
  return formatTokenBalance(raw, token);
}

export function exportWillsToCSV(wills: Will[]): string {
  validateBeneficiariesForExport(wills);

  const headers = [
    'Will ID',
    'Owner',
    'Status',
    'Balance',
    'Token',
    'Check-in Period (days)',
    'Grace Period (days)',
    'Beneficiaries',
    'Guardians',
  ];

  const rows = wills.map((will) => {
    const formattedBalance = formatExportBalance(will.balance, will.token);

    const beneficiariesStr = (Array.isArray(will.beneficiaries) ? will.beneficiaries : [])
      .map((b) => (typeof b === 'string' ? b : (b as { address?: string })?.address || ''))
      .join(';');

    const guardiansStr = (Array.isArray(will.guardians) ? will.guardians : [])
      .map((g) => (typeof g === 'string' ? g : (g as { address?: string })?.address || ''))
      .join(';');

    return [
      escapeCSVField(will.id),
      escapeCSVField(will.owner),
      escapeCSVField(will.status),
      escapeCSVField(formattedBalance),
      escapeCSVField(will.token),
      escapeCSVField(will.checkinPeriodDays),
      escapeCSVField(will.gracePeriodDays),
      escapeCSVField(beneficiariesStr),
      escapeCSVField(guardiansStr),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function validateExportData(original: Will, exported: unknown): boolean {
  if (!exported || typeof exported !== 'object') return false;
  const obj = exported as Record<string, unknown>;

  if (original.id !== obj.willId) return false;
  if (original.owner !== obj.owner) return false;

  if (obj.beneficiaries !== undefined) {
    if (!Array.isArray(obj.beneficiaries)) {
      return false;
    }
    if (original.beneficiaries && original.beneficiaries.length > 0) {
      const exportedAddrs = new Set(obj.beneficiaries);
      for (const b of original.beneficiaries) {
        if (!exportedAddrs.has(b.address)) {
          return false;
        }
      }
    }
  }

  return true;
}
