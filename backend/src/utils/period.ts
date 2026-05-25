export interface Period {
  year: number;
  month: number; // 1-12
}

export function currentPeriod(now: Date = new Date()): Period {
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

export function periodKey(p: Period): string {
  return `${p.year}-${String(p.month).padStart(2, "0")}`;
}

/** End of month, last day at 23:59:59.999 UTC. */
export function endOfPeriod(p: Period): Date {
  return new Date(Date.UTC(p.year, p.month, 0, 23, 59, 59, 999));
}
