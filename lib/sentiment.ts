import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  type MarketSnapshot,
  type CategoryMoodScore,
  type MoodSnapshot,
  type SentimentRegime,
  MarketSnapshotSchema,
} from './schemas';

export function getRegime(score: number): SentimentRegime {
  if (score <= 25) return 'Extreme Fear';
  if (score <= 45) return 'Fear';
  if (score <= 55) return 'Neutral';
  if (score <= 75) return 'Greed';
  return 'Extreme Greed';
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

/**
 * 1. Market Breadth & Price Action Index (BMI)
 * Evaluates Nifty 500 Advance/Decline ratio, % advancing stocks, and 52-week envelope skew.
 */
export function computeBreadthIndex(snapshot: MarketSnapshot): CategoryMoodScore {
  const breadth = snapshot.breadth;
  const advances = breadth?.advances ?? 0;
  const declines = breadth?.declines ?? 0;
  const unchanged = breadth?.unchanged ?? 0;
  const total = advances + declines + unchanged;
  const adRatio = breadth?.adRatio ?? (declines ? advances / declines : advances ? 2 : 1);
  const pctAdvancing = total > 0 ? Number(((advances / total) * 100).toFixed(1)) : 50;

  const highsCount = snapshot.near52wHigh?.length ?? 0;
  const lowsCount = snapshot.near52wLow?.length ?? 0;

  // Base score from A/D ratio (1.0 = 50, 2.5+ = 85+, 0.4- = 15-)
  let rawScore = 50;
  if (adRatio >= 1.0) {
    rawScore = 50 + Math.min(42, ((adRatio - 1.0) / 1.8) * 42);
  } else {
    rawScore = 50 - Math.min(42, ((1.0 - adRatio) / 0.75) * 42);
  }

  // 52-week high vs low skew modifier (-8 to +8 points)
  const envTotal = highsCount + lowsCount;
  if (envTotal > 0) {
    const skew = (highsCount - lowsCount) / envTotal;
    rawScore += skew * 8;
  }

  const score = clamp(rawScore);
  const regime = getRegime(score);

  let summary = `Balanced breadth (${advances} Adv / ${declines} Dec, A/D ${adRatio.toFixed(2)})`;
  if (score >= 70) {
    summary = `Bullish breadth expansion (${advances} Adv / ${declines} Dec, A/D ${adRatio.toFixed(2)}, ${highsCount} near 52W highs)`;
  } else if (score <= 35) {
    summary = `Pervasive market distribution (${declines} Declines vs ${advances} Advances, A/D ${adRatio.toFixed(2)})`;
  }

  return {
    score,
    regime,
    label: 'Breadth & Price Action',
    weight: 0.25,
    summary,
    metrics: {
      adRatio: Number(adRatio.toFixed(2)),
      advances,
      declines,
      pctAdvancing,
      near52wHighs: highsCount,
      near52wLows: lowsCount,
    },
  };
}

/**
 * 2. Institutional & Liquidity Flow Index (IFI)
 * Evaluates FII & DII net cash flows and institutional commitment.
 */
export function computeFlowsIndex(snapshot: MarketSnapshot): CategoryMoodScore {
  const fiiDii = snapshot.fiiDii;
  const fiiNet = fiiDii?.fiiNet ?? 0;
  const diiNet = fiiDii?.diiNet ?? 0;
  const totalNet = fiiNet + diiNet;

  // FII Net is the primary driver of institutional risk appetite
  let rawScore = 50;
  if (fiiNet >= 0) {
    rawScore = 50 + Math.min(45, (fiiNet / 3500) * 45);
  } else {
    rawScore = 50 - Math.min(45, (Math.abs(fiiNet) / 5000) * 45);
  }

  // Domestic buffer adjustment: DII buying softens FII selling shocks
  if (fiiNet < -1500 && diiNet > 2000) {
    rawScore += Math.min(8, (diiNet / 4000) * 8);
  } else if (fiiNet < 0 && diiNet < 0) {
    rawScore -= 6; // Coordinated institutional selling
  }

  const score = clamp(rawScore);
  const regime = getRegime(score);

  let summary = `Neutral institutional flow (FII: ${fiiNet >= 0 ? '+' : ''}${fiiNet} Cr, DII: ${diiNet >= 0 ? '+' : ''}${diiNet} Cr)`;
  if (score >= 65) {
    summary = `Strong institutional accumulation (FII: +₹${fiiNet.toLocaleString()} Cr)`;
  } else if (score <= 35) {
    summary = `Heavy institutional offloading (FII: -₹${Math.abs(fiiNet).toLocaleString()} Cr)`;
  }

  return {
    score,
    regime,
    label: 'Institutional Flows',
    weight: 0.25,
    summary,
    metrics: {
      fiiNet,
      diiNet,
      totalNet,
      asOf: fiiDii?.asOf ?? null,
    },
  };
}

/**
 * 3. Volatility & Macro Risk Appetite Index (VRI)
 * Evaluates India VIX (inverted), VIX intraday momentum, and safe-haven flight (Gold/USD-INR).
 */
export function computeVolatilityIndex(snapshot: MarketSnapshot): CategoryMoodScore {
  const vixObj = snapshot.vix;
  const vix = vixObj?.value ?? 14.0;
  const vixChangePct = vixObj?.changePct ?? 0;

  // Gold & USD/INR flight check
  const gold = snapshot.commodities?.find((c) => c.name.toLowerCase().includes('gold'));
  const usdinr = snapshot.currencies?.find((c) => c.pair.toUpperCase().includes('USD'));
  const goldChange = gold?.changePct ?? 0;
  const usdinrChange = usdinr?.changePct ?? 0;

  // Inverted VIX scale (VIX 11 = 88, VIX 13.5 = 62, VIX 16 = 46, VIX 22 = 20, VIX 28+ = 5)
  let rawScore = 50;
  if (vix <= 14.5) {
    rawScore = 50 + Math.min(45, ((14.5 - vix) / 4.0) * 45);
  } else {
    rawScore = 50 - Math.min(45, ((vix - 14.5) / 10.0) * 45);
  }

  // Intraday shock penalty
  if (vixChangePct > 4) {
    rawScore -= Math.min(14, (vixChangePct / 2.0));
  } else if (vixChangePct < -4) {
    rawScore += Math.min(6, (Math.abs(vixChangePct) / 3.0));
  }

  // Safe haven flight check: Gold surge + Rupee depreciation during equities drop
  if (goldChange > 1.0 && usdinrChange > 0.3) {
    rawScore -= 6;
  }

  const score = clamp(rawScore);
  const regime = getRegime(score);

  let summary = `Normal market volatility (India VIX at ${vix.toFixed(2)})`;
  if (score >= 70) {
    summary = `Complacent volatility environment (India VIX subdued at ${vix.toFixed(2)})`;
  } else if (score <= 35) {
    summary = `Elevated volatility & systemic risk (India VIX spiking at ${vix.toFixed(2)}, ${vixChangePct >= 0 ? '+' : ''}${vixChangePct.toFixed(1)}%)`;
  }

  return {
    score,
    regime,
    label: 'Volatility & Risk Appetite',
    weight: 0.25,
    summary,
    metrics: {
      vix,
      vixChangePct,
      goldChangePct: goldChange,
      usdinrChangePct: usdinrChange,
    },
  };
}

/**
 * 4. Derivatives & Options Skew Index (DSI)
 * Evaluates Nifty Put-Call Ratio (PCR) from Open Interest and options volume put/call skew.
 */
export function computeDerivativesIndex(snapshot: MarketSnapshot): CategoryMoodScore {
  const derivatives = snapshot.derivatives;
  const pcrOi = derivatives?.pcrOi ?? null;
  const pcrVolume = derivatives?.pcrVolume ?? null;

  // When derivatives data is missing (e.g. weekend or unpopulated feed)
  if (pcrOi === null || pcrOi <= 0) {
    return {
      score: 50,
      regime: 'Neutral',
      label: 'Derivatives & Options Skew',
      weight: 0.25,
      summary: 'Derivatives Open Interest data pending / neutral baseline (PCR ~ 1.00)',
      metrics: {
        pcrOi: null,
        pcrVolume: null,
        available: 'pending',
      },
    };
  }

  // Inverted / Contrarian Options Scale:
  // PCR < 0.70: Extreme call concentration / complacency / overbought greed (Score: 80 - 95)
  // PCR 0.90 - 1.05: Balanced hedging / neutral (Score: 45 - 55)
  // PCR 1.15 - 1.25: Cautious hedging / fear (Score: 30 - 40)
  // PCR > 1.35: Extreme put buying / panic protection / oversold fear (Score: 10 - 25)
  let rawScore = 50;
  if (pcrOi <= 1.0) {
    rawScore = 50 + Math.min(45, ((1.0 - pcrOi) / 0.45) * 45);
  } else {
    rawScore = 50 - Math.min(45, ((pcrOi - 1.0) / 0.45) * 45);
  }

  // Volume PCR intraday divergence modifier
  if (pcrVolume !== null && pcrVolume > 0) {
    if (pcrVolume > pcrOi + 0.2) {
      rawScore -= 5; // Heavy intraday put buying shock
    } else if (pcrVolume < pcrOi - 0.2) {
      rawScore += 5; // Intraday speculative call rush
    }
  }

  const score = clamp(rawScore);
  const regime = getRegime(score);

  let summary = `Balanced options hedging posture (Nifty PCR at ${pcrOi.toFixed(2)})`;
  if (score >= 70) {
    summary = `Complacent call-dominated options posture (Nifty PCR low at ${pcrOi.toFixed(2)}, froth elevated)`;
  } else if (score <= 35) {
    summary = `Heavy protective put buying & hedging (Nifty PCR elevated at ${pcrOi.toFixed(2)}, oversold)`;
  }

  return {
    score,
    regime,
    label: 'Derivatives & Options Skew',
    weight: 0.25,
    summary,
    metrics: {
      pcrOi,
      pcrVolume,
      callVolumePct: derivatives?.callVolumePct ?? null,
      putVolumePct: derivatives?.putVolumePct ?? null,
    },
  };
}

/**
 * Computes the Master Composite Market Mood Index and returns a full MoodSnapshot.
 */
export function computeMoodSnapshot(
  snapshot: MarketSnapshot,
  session: 'morning' | 'closing' = 'closing'
): MoodSnapshot {
  const breadth = computeBreadthIndex(snapshot);
  const flows = computeFlowsIndex(snapshot);
  const volatility = computeVolatilityIndex(snapshot);
  const derivatives = computeDerivativesIndex(snapshot);

  const isDerivativesAvailable = derivatives.metrics.pcrOi !== null;

  let composite: number;
  if (isDerivativesAvailable) {
    composite = clamp(
      breadth.score * 0.25 +
      flows.score * 0.25 +
      volatility.score * 0.25 +
      derivatives.score * 0.25
    );
  } else {
    // Dynamic re-weighting when derivatives data is unavailable
    breadth.weight = 0.34;
    flows.weight = 0.33;
    volatility.weight = 0.33;
    derivatives.weight = 0.0;
    composite = clamp(
      breadth.score * 0.34 +
      flows.score * 0.33 +
      volatility.score * 0.33
    );
  }

  const regime = getRegime(composite);

  // Synthesize overarching broadsheet summary
  let summary = `Market sentiment resides in ${regime} territory (${composite}/100). `;
  if (composite <= 25) {
    summary += `Capitulation levels: severe institutional selling and heavy hedging signal asymmetric contrarian accumulation.`;
  } else if (composite <= 45) {
    summary += `Defensive positioning dominates: institutional outflows or breadth deterioration counsel strict risk management.`;
  } else if (composite <= 55) {
    summary += `Equilibrium regime: balanced market breadth and calm volatility as participants await fresh catalysts.`;
  } else if (composite <= 75) {
    summary += `Risk-on expansion: broad cash participation and healthy institutional momentum support trend continuation.`;
  } else {
    summary += `Overheated speculative euphoria: low options hedging and euphoric breadth indicate elevated mean-reversion risk.`;
  }

  return {
    composite,
    regime,
    session,
    asOf: snapshot.asOf,
    summary,
    categories: {
      breadth,
      flows,
      volatility,
      derivatives,
    },
  };
}

/**
 * Reads stored snapshots in data/snapshots/{year}/{month}/ and returns historical mood records.
 */
export function getHistoricalMoods(limit = 30): Array<{ date: string; mood: MoodSnapshot }> {
  const baseDir = join(process.cwd(), 'data', 'snapshots');
  if (!existsSync(baseDir)) return [];

  const snapshotFiles: Array<{ date: string; path: string }> = [];

  const years = readdirSync(baseDir).filter((y) => /^\d{4}$/.test(y)).sort().reverse();
  for (const year of years) {
    const yearDir = join(baseDir, year);
    const months = readdirSync(yearDir).filter((m) => /^\d{2}$/.test(m)).sort().reverse();
    for (const month of months) {
      const monthDir = join(yearDir, month);
      const days = readdirSync(monthDir).filter((d) => d.endsWith('.json')).sort().reverse();
      for (const dayFile of days) {
        const date = dayFile.replace('.json', '');
        snapshotFiles.push({ date, path: join(monthDir, dayFile) });
        if (snapshotFiles.length >= limit) break;
      }
      if (snapshotFiles.length >= limit) break;
    }
    if (snapshotFiles.length >= limit) break;
  }

  const results: Array<{ date: string; mood: MoodSnapshot }> = [];
  for (const item of snapshotFiles) {
    try {
      const raw = readFileSync(item.path, 'utf8');
      const snapshot = MarketSnapshotSchema.parse(JSON.parse(raw));
      const mood = snapshot.sentiment ?? computeMoodSnapshot(snapshot, 'closing');
      results.push({ date: item.date, mood });
    } catch {
      // Continue
    }
  }

  return results;
}
