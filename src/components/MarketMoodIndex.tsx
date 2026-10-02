'use client';

import Link from 'next/link';
import type { MoodSnapshot, SentimentRegime } from '../../lib/schemas';

interface MarketMoodIndexProps {
  mood: MoodSnapshot;
  compact?: boolean;
}

const REGIME_COLORS: Record<SentimentRegime, { text: string; bg: string; border: string }> = {
  'Extreme Fear': { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-300 dark:border-red-800' },
  'Fear': { text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-800' },
  'Neutral': { text: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800/40', border: 'border-zinc-300 dark:border-zinc-700' },
  'Greed': { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-800' },
  'Extreme Greed': { text: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-300 dark:border-teal-800' },
};

export function MarketMoodIndex({ mood, compact = false }: MarketMoodIndexProps) {
  const { composite, regime, session, categories } = mood;
  const style = REGIME_COLORS[regime] ?? REGIME_COLORS.Neutral;

  // Percentage position of composite score on 0-100 scale
  const needlePos = Math.max(2, Math.min(98, composite));

  return (
    <section className="site-panel p-3.5 mb-3 border border-[var(--color-hairline)] bg-[var(--color-surface)]" aria-label="Market Mood Index">
      {/* Broadsheet Panel Eyebrow */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[var(--color-hairline)] text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)]">
        <span className="font-bold text-[var(--color-ink)]">
          Market Mood Index · 0–100
        </span>
        <span className="text-[9px]">
          {session === 'closing' ? 'Official Close (15:45 IST)' : 'Morning Stance (08:30 IST)'}
        </span>
      </div>

      {/* Main Score & Regime Display */}
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl font-extrabold text-[var(--color-ink)] tabular-nums tracking-tight">
            {composite}
          </span>
          <span className="font-mono text-[11px] text-[var(--color-muted)]">
            / 100
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wide uppercase border ${style.bg} ${style.text} ${style.border}`}>
          {regime}
        </span>
      </div>

      {/* 5-Zone Segmented Gauge Meter */}
      <div className="space-y-1 mb-3">
        <div className="relative h-2 rounded overflow-hidden flex bg-zinc-100 dark:bg-zinc-800">
          {/* Extreme Fear */}
          <div className="w-[25%] bg-red-600/80" title="Extreme Fear (0-25)" />
          {/* Fear */}
          <div className="w-[20%] bg-amber-500/80" title="Fear (26-45)" />
          {/* Neutral */}
          <div className="w-[10%] bg-zinc-400/80" title="Neutral (46-55)" />
          {/* Greed */}
          <div className="w-[20%] bg-emerald-500/80" title="Greed (56-75)" />
          {/* Extreme Greed */}
          <div className="w-[25%] bg-teal-600/80" title="Extreme Greed (76-100)" />

          {/* Needle Pointer */}
          <div
            className="absolute top-0 bottom-0 w-1.5 -ml-0.75 bg-[var(--color-ink)] shadow ring-1 ring-white dark:ring-black"
            style={{ left: `${needlePos}%` }}
          />
        </div>

        {/* Meter Labels */}
        <div className="flex justify-between text-[9px] font-mono text-[var(--color-muted)] px-0.5">
          <span>0 Extreme Fear</span>
          <span>50 Neutral</span>
          <span>100 Euphoria</span>
        </div>
      </div>

      {/* Summary Narrative */}
      <p className="text-[11px] font-serif text-[var(--color-muted)] leading-relaxed mb-3">
        {mood.summary}
      </p>

      {/* 4 Category Sub-Indexes Grid */}
      <div className="space-y-2 pt-2 border-t border-[var(--color-hairline)]">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)]">
          <span>Category Breakdown</span>
          <span>Score (Weight)</span>
        </div>

        {/* 1. Breadth & Price Action */}
        <div>
          <div className="flex justify-between text-[10px] font-mono mb-0.5">
            <span className="text-[var(--color-ink)]">1. Breadth &amp; Participation</span>
            <span className="tabular-nums font-bold text-[var(--color-ink)]">
              {categories.breadth.score} <span className="text-[9px] font-normal text-[var(--color-muted)]">({Math.round(categories.breadth.weight * 100)}%)</span>
            </span>
          </div>
          <div className="h-1 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500"
              style={{ width: `${categories.breadth.score}%` }}
            />
          </div>
        </div>

        {/* 2. Institutional Flows */}
        <div>
          <div className="flex justify-between text-[10px] font-mono mb-0.5">
            <span className="text-[var(--color-ink)]">2. Institutional Flows</span>
            <span className="tabular-nums font-bold text-[var(--color-ink)]">
              {categories.flows.score} <span className="text-[9px] font-normal text-[var(--color-muted)]">({Math.round(categories.flows.weight * 100)}%)</span>
            </span>
          </div>
          <div className="h-1 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-500"
              style={{ width: `${categories.flows.score}%` }}
            />
          </div>
        </div>

        {/* 3. Volatility & Macro Risk */}
        <div>
          <div className="flex justify-between text-[10px] font-mono mb-0.5">
            <span className="text-[var(--color-ink)]">3. Volatility &amp; Risk (VIX)</span>
            <span className="tabular-nums font-bold text-[var(--color-ink)]">
              {categories.volatility.score} <span className="text-[9px] font-normal text-[var(--color-muted)]">({Math.round(categories.volatility.weight * 100)}%)</span>
            </span>
          </div>
          <div className="h-1 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-amber-600 dark:bg-amber-500"
              style={{ width: `${categories.volatility.score}%` }}
            />
          </div>
        </div>

        {/* 4. Derivatives & Options Skew */}
        <div>
          <div className="flex justify-between text-[10px] font-mono mb-0.5">
            <span className="text-[var(--color-ink)]">4. Derivatives &amp; Options PCR</span>
            <span className="tabular-nums font-bold text-[var(--color-ink)]">
              {categories.derivatives.score} <span className="text-[9px] font-normal text-[var(--color-muted)]">({Math.round(categories.derivatives.weight * 100)}%)</span>
            </span>
          </div>
          <div className="h-1 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-purple-600 dark:bg-purple-500"
              style={{ width: `${categories.derivatives.score}%` }}
            />
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 pt-2 border-t border-[var(--color-hairline)] flex items-center justify-between text-[10px] font-mono text-[var(--color-muted)]">
          <span>Single Source of Truth</span>
          <Link
            href="/sentiment"
            className="font-bold underline text-[var(--color-ink)] hover:opacity-80"
          >
            Explore Historical Timeseries &rarr;
          </Link>
        </div>
      )}
    </section>
  );
}
