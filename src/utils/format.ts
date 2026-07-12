// ──────────────────────────────────────────────
// Format Helpers
// ──────────────────────────────────────────────

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', options ?? { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

// Build monthly buckets from a list of items that have a 'date' or 'createdAt' field
export function bucketByMonth<T extends Record<string, any>>(
  items: T[],
  dateKey: keyof T,
  valueKey: keyof T
): { month: string; value: number }[] {
  const buckets: Record<string, number> = {};
  for (const item of items) {
    const raw = item[dateKey];
    if (!raw) continue;
    const d = typeof raw === 'string' ? new Date(raw) : (typeof raw === 'object' && Object.prototype.toString.call(raw) === '[object Date]') ? (raw as Date) : new Date(((raw as any).seconds ?? 0) * 1000);
    const label = formatMonthLabel(d);
    buckets[label] = (buckets[label] || 0) + Number(item[valueKey] || 0);
  }
  return Object.entries(buckets).map(([month, value]) => ({ month, value }));
}
