// en-CA formats as YYYY-MM-DD. Asia/Kolkata applies the IST (+5:30) offset.
export function istDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function istParts(now: Date = new Date()): { year: number; month: number; day: number } {
  const [year, month, day] = istDateString(now).split('-').map(Number);
  return { year, month, day };
}

export function isFirstOfMonthIST(now: Date = new Date()): boolean {
  return istParts(now).day === 1;
}

export function istMonthId(now: Date = new Date()): string {
  const { year, month } = istParts(now);
  return `${year}-${String(month).padStart(2, '0')}`;
}

// ISO-8601 week id (e.g. "2026-W24"), computed on the IST calendar date.
export function istWeekId(now: Date = new Date()): string {
  const { year, month, day } = istParts(now);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // Thursday of this ISO week
  const isoYear = date.getUTCFullYear();
  const jan1 = new Date(Date.UTC(isoYear, 0, 1));
  const week = 1 + Math.round((date.getTime() - jan1.getTime()) / 86400000 / 7);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}
