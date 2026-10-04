'use client';

import { useEffect, useState } from 'react';

const TIME_ZONE = 'Asia/Kolkata';

// NSE equity holidays for 2026. Refresh this list when the exchange publishes
// each year's trading calendar. Muhurat trading on 8 Nov has separate hours.
const MARKET_HOLIDAYS = new Set([
  '2026-01-15', '2026-01-26', '2026-03-03', '2026-03-26', '2026-03-31',
  '2026-04-03', '2026-04-14', '2026-05-01', '2026-05-28', '2026-06-26',
  '2026-08-26', '2026-09-14', '2026-10-02', '2026-10-20', '2026-11-10',
  '2026-11-24', '2026-12-25',
]);

const MUHURAT_DAY = '2026-11-08';

function istClock(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    weekday: values.weekday,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

function marketSession(now: Date) {
  const { date, weekday, minutes } = istClock(now);
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  if (date === MUHURAT_DAY) {
    return { label: 'Special session', state: 'auction' };
  }
  if (MARKET_HOLIDAYS.has(date)) {
    return { label: 'Market closed', state: 'closed' };
  }
  if (isWeekend) {
    return { label: 'Market closed', state: 'closed' };
  }

  if (minutes >= 9 * 60 && minutes < 9 * 60 + 8) {
    return { label: 'Pre-open', state: 'auction' };
  }
  if (minutes >= 9 * 60 + 8 && minutes < 9 * 60 + 15) {
    return { label: 'Opening auction', state: 'auction' };
  }
  if (minutes >= 9 * 60 + 15 && minutes < 15 * 60 + 15) {
    return { label: 'Market open', state: 'open' };
  }
  if (minutes >= 15 * 60 + 15 && minutes < 15 * 60 + 30) {
    return { label: 'Closing auction', state: 'auction' };
  }
  if (minutes >= 15 * 60 + 40 && minutes < 16 * 60) {
    return { label: 'Post-close session', state: 'auction' };
  }
  if (minutes >= 16 * 60 || minutes < 9 * 60) {
    return { label: 'Market closed', state: 'closed' };
  }
  return { label: 'Market closed', state: 'closed' };
}

const STATUS_CLASS: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-800',
  auction: 'bg-amber-50 text-amber-800',
  closed: 'bg-rose-50 text-rose-800',
};

export function MarketSessionStatus() {
  const [session, setSession] = useState<{ label: string; state: string } | null>(null);

  useEffect(() => {
    const update = () => setSession(marketSession(new Date()));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 ${session ? STATUS_CLASS[session.state] : 'text-[var(--color-muted)]'}`}
      title="NSE equity schedule, calculated from the device clock in IST. CAS applies to eligible F&O stocks; AMO availability and hours depend on your broker."
      aria-live="polite"
    >
      {session?.label ?? 'Market status'}
    </span>
  );
}
