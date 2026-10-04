'use client';

import Link from 'next/link';
import type { MoodSnapshot } from '../../lib/schemas';

interface MarketMoodIndexProps {
  mood: MoodSnapshot;
  compact?: boolean;
  showFactors?: boolean;
}

export function MarketMoodIndex({ mood, compact = false, showFactors = true }: MarketMoodIndexProps) {
  const { composite, regime, session, categories } = mood;

  // Percentage position of composite score on 0-100 scale
  const needlePos = Math.max(1, Math.min(99, composite));
  const cleanSummary = mood.summary
    .replace(/^Market sentiment resides in [^.]+\.\s*/i, '')
    .trim();
  const summary = compact && /^Capitulation levels:/i.test(cleanSummary) ? '' : cleanSummary;

  return (
    <div className={`font-serif ${compact ? 'space-y-2' : 'pb-4 border-b border-[var(--color-hairline)]'}`} aria-label="Sentiment Index">
      {/* Broadsheet Column Header */}
      <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
        <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">
          Sentiment Index
        </span>
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {!compact && (
            <span className="text-[10px] text-[var(--color-muted)]">
              {session === 'closing' ? 'Official Close (15:45 IST)' : 'Morning Stance (08:30 IST)'} ·
            </span>
          )}
          <span className="font-bold text-[var(--color-ink)] tabular-nums">
            {composite} <span className="text-[var(--color-muted)] font-normal">/ 100</span>
          </span>
          <span className="text-[var(--color-muted)]">·</span>
          <span className="font-semibold text-[var(--color-ink)] uppercase tracking-wide">
            {regime}
          </span>
        </div>
      </div>

      {/* Engraved Newsprint Barometer Track */}
      <div className="space-y-1 mb-2">
        <div className="relative h-1 bg-[linear-gradient(90deg,var(--color-bullish)_0%,#d8c08d_50%,var(--color-bearish)_100%)]">
          {/* Subtle 50 mid-tick */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--color-muted)]/40" />
          {/* Engraved Needle Pointer */}
          <div
            className="absolute -top-0.5 w-1.5 h-2 bg-[var(--color-ink)]"
            style={{ left: `${needlePos}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-[var(--color-muted)]">
          <span>0 Oversold</span>
          <span>50 Balanced</span>
          <span>100 Overbought</span>
        </div>
      </div>

      {/* Narrative Editorial Summary */}
      {summary && (
        <p className="text-xs text-[var(--color-muted)] leading-relaxed text-justify mb-2">
          {summary}
        </p>
      )}

      {/* 4 Category Sub-Indexes Typeset as Financial Ledger (or link to full index) */}
      {showFactors ? (
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
      ) : (
        <div className="pt-2 border-t border-[var(--color-hairline)] text-right text-xs font-serif italic">
          <Link
            href="/sentiment-index"
            className="text-[var(--color-ink)] hover:underline transition-colors"
          >
            Open Sentiment Index
          </Link>
        </div>
      )}

      {!compact && showFactors && (
        <div className="mt-2.5 pt-1.5 border-t border-[var(--color-hairline)] text-right text-xs font-serif italic">
          <Link
            href="/sentiment-index"
            className="text-[var(--color-ink)] hover:underline transition-colors"
          >
            View sentiment history
          </Link>
        </div>
      )}
    </div>
  );
}
