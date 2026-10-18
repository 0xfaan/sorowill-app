export function isValidWillId(id: string): boolean {
  return /^\d+$/.test(id);
}

export function isValidContractAddress(address: string): boolean {
  return /^C[A-Z2-7]{55}$/.test(address);
}