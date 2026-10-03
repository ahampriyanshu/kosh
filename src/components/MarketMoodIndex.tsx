'use client';

import Link from 'next/link';
import type { MoodSnapshot } from '../../lib/schemas';

interface MarketMoodIndexProps {
  mood: MoodSnapshot;
  compact?: boolean;
}

export function MarketMoodIndex({ mood, compact = false }: MarketMoodIndexProps) {
  const { composite, regime, session, categories } = mood;

  // Percentage position of composite score on 0-100 scale
  const needlePos = Math.max(1, Math.min(99, composite));

  return (
    <div className={`font-serif ${compact ? 'pb-3' : 'pb-4 border-b border-[var(--color-hairline)]'}`} aria-label="Market Mood Index">
      {/* Broadsheet Column Header */}
      <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs">
        <h2 className="font-serif font-bold text-sm text-[var(--color-ink)] uppercase tracking-wider">
          Market Mood Index
        </h2>
        {!compact && (
          <span className="font-mono text-[10px] text-[var(--color-muted)]">
            {session === 'closing' ? 'Official Close (15:45 IST)' : 'Morning Stance (08:30 IST)'}
          </span>
        )}
      </div>

      {/* Main Score & Typographic Regime */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-2xl md:text-3xl font-bold tabular-nums text-[var(--color-ink)] tracking-tight">
            {composite}
          </span>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            / 100
          </span>
        </div>
        <span className="font-serif font-semibold text-xs tracking-wider uppercase text-[var(--color-ink)]">
          [ {regime} ]
        </span>
      </div>

      {/* Engraved 5-Zone Broadsheet Barometer */}
      <div className="space-y-1 mb-2.5">
        <div className="relative h-1.5 bg-[var(--color-hairline)] flex">
          {/* Extreme Fear (0-25) */}
          <div className="w-[25%] border-r border-[var(--color-surface)] bg-[var(--color-bearish)] opacity-85" title="Extreme Fear (0-25)" />
          {/* Fear (26-45) */}
          <div className="w-[20%] border-r border-[var(--color-surface)] bg-[var(--color-bearish)] opacity-40" title="Fear (26-45)" />
          {/* Neutral (46-55) */}
          <div className="w-[10%] border-r border-[var(--color-surface)] bg-[var(--color-muted)] opacity-35" title="Neutral (46-55)" />
          {/* Greed (56-75) */}
          <div className="w-[20%] border-r border-[var(--color-surface)] bg-[var(--color-bullish)] opacity-40" title="Greed (56-75)" />
          {/* Extreme Greed (76-100) */}
          <div className="w-[25%] bg-[var(--color-bullish)] opacity-85" title="Extreme Greed (76-100)" />

          {/* Precision Needle Pointer */}
          <div
            className="absolute -top-1 w-0.5 h-3.5 bg-[var(--color-ink)] shadow-sm"
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

      {/* Narrative Attribution */}
      <p className="text-xs text-[var(--color-muted)] leading-relaxed mb-3 text-justify">
        {mood.summary}
      </p>

      {/* 4 Category Sub-Indexes Typeset as Financial Ledger */}
      <div className="space-y-2 pt-2 border-t border-[var(--color-hairline)] text-xs">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)] mb-1">
          <span>Factor Attribution</span>
          <span>Score (Weight)</span>
        </div>

        {/* 1. Breadth & Price Action */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--color-ink)]">1. Breadth &amp; Participation</span>
            <span className="font-mono tabular-nums font-semibold text-[var(--color-ink)]">
              {categories.breadth.score} <span className="font-normal text-[var(--color-muted)] text-[10px]">({Math.round(categories.breadth.weight * 100)}%)</span>
            </span>
          </div>
          <div className="h-0.5 bg-[var(--color-hairline)] overflow-hidden">
            <div
              className="h-full bg-[var(--color-ink)]"
              style={{ width: `${categories.breadth.score}%` }}
            />
          </div>
        </div>

        {/* 2. Institutional Flows */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--color-ink)]">2. Institutional Flows</span>
            <span className="font-mono tabular-nums font-semibold text-[var(--color-ink)]">
              {categories.flows.score} <span className="font-normal text-[var(--color-muted)] text-[10px]">({Math.round(categories.flows.weight * 100)}%)</span>
            </span>
          </div>
          <div className="h-0.5 bg-[var(--color-hairline)] overflow-hidden">
            <div
              className="h-full bg-[var(--color-ink)]"
              style={{ width: `${categories.flows.score}%` }}
            />
          </div>
        </div>

        {/* 3. Volatility & Macro Risk */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--color-ink)]">3. Volatility &amp; Risk (VIX)</span>
            <span className="font-mono tabular-nums font-semibold text-[var(--color-ink)]">
              {categories.volatility.score} <span className="font-normal text-[var(--color-muted)] text-[10px]">({Math.round(categories.volatility.weight * 100)}%)</span>
            </span>
          </div>
          <div className="h-0.5 bg-[var(--color-hairline)] overflow-hidden">
            <div
              className="h-full bg-[var(--color-ink)]"
              style={{ width: `${categories.volatility.score}%` }}
            />
          </div>
        </div>

        {/* 4. Derivatives & Options Skew */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--color-ink)]">4. Derivatives &amp; Options PCR</span>
            <span className="font-mono tabular-nums font-semibold text-[var(--color-ink)]">
              {categories.derivatives.score} <span className="font-normal text-[var(--color-muted)] text-[10px]">({Math.round(categories.derivatives.weight * 100)}%)</span>
            </span>
          </div>
          <div className="h-0.5 bg-[var(--color-hairline)] overflow-hidden">
            <div
              className="h-full bg-[var(--color-ink)]"
              style={{ width: `${categories.derivatives.score}%` }}
            />
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-2.5 pt-1.5 border-t border-[var(--color-hairline)] text-right text-xs">
          <Link
            href="/sentiment"
            className="underline hover:text-[var(--color-ink)] transition-colors"
          >
            Explore Historical Timeseries &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
