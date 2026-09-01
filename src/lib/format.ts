export function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(cents / 100);
}
