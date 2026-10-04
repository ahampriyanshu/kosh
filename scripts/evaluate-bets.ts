import { pathToFileURL } from 'node:url';
import { istDateString } from '../lib/time';
import { getExpiringActiveBets, settleBet } from '../lib/bets-store';
import { getQuote, getHistorical } from '../lib/market-data';
import { structure } from '../lib/llm';
import { PostMortemSchema, type SystematicBet, type PostMortem } from '../lib/schemas';

function formatYahooTicker(ticker: string): string {
  if (ticker.includes('.') || ticker.startsWith('^')) return ticker;
  return `${ticker}.NS`;
}

export async function generatePostMortem(
  bet: SystematicBet,
  closePrice: number,
  returnPct: number,
  maxHigh: number,
  minLow: number,
): Promise<PostMortem> {
  const prompt = `
You are the Chief Risk Officer and Senior Portfolio Auditor for Kosh Institutional Equities.
An equity call has reached its expiry date and MISSED its quantitative objective.
Perform an objective, mathematically grounded post-mortem analysis.

Call Metadata:
- Ticker: ${bet.ticker} (${bet.name})
- Horizon: ${bet.horizon}
- Category: ${bet.category}
- Action: ${bet.action.toUpperCase()}
- Call Date: ${bet.callDate}
- Expiry Date: ${bet.expiryDate}
- Entry Price: ₹${bet.entryPrice.toLocaleString('en-IN')}
- Target Price: ₹${bet.targetPrice.toLocaleString('en-IN')}
- Invalidation Stop: ₹${bet.stopLossPrice.toLocaleString('en-IN')}
- Settlement Close Price: ₹${closePrice.toLocaleString('en-IN')} (${returnPct >= 0 ? '+' : ''}${returnPct}%)
- Holding Period Max High: ₹${maxHigh.toLocaleString('en-IN')}
- Holding Period Min Low: ₹${minLow.toLocaleString('en-IN')}
- Original Algorithmic Triggers: ${bet.triggers}
- Original Investment Thesis: ${bet.thesis}

Instructions:
1) "whatWentWrong": State exactly what macro, sector, fundamental, or technical factor caused the setup to fail before reaching target (2 sentences).
2) "howToAvoid": State a concrete screening filter or invalidation rule that could have prevented entry or reduced drawdown (1-2 sentences).
`;

  try {
    const res = await structure(prompt, PostMortemSchema);
    return {
      whatWentWrong: res.whatWentWrong,
      howToAvoid: res.howToAvoid,
      analyzedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`[evaluate-bets] LLM post-mortem fallback for ${bet.ticker}:`, err);
    return {
      whatWentWrong: `Price failed to reach the quantitative target of ₹${bet.targetPrice} during the holding window, settling at ₹${closePrice} (${returnPct >= 0 ? '+' : ''}${returnPct}%).`,
      howToAvoid: `Enforce stricter volume confirmation and sector relative strength gates before entering ${bet.category} setups.`,
      analyzedAt: new Date().toISOString(),
    };
  }
}

export async function evaluateExpiringBets(now: Date = new Date()): Promise<{
  evaluated: number;
  hits: number;
  misses: number;
  settled: SystematicBet[];
}> {
  const todayStr = istDateString(now);
  const expiring = await getExpiringActiveBets(todayStr);

  if (expiring.length === 0) {
    console.log(`[evaluate-bets] No active bets due for expiry on or before ${todayStr}.`);
    return { evaluated: 0, hits: 0, misses: 0, settled: [] };
  }

  console.log(`[evaluate-bets] Found ${expiring.length} bets due for expiry on or before ${todayStr}.`);

  const settledList: SystematicBet[] = [];
  let hits = 0;
  let misses = 0;

  for (const bet of expiring) {
    const yfTicker = formatYahooTicker(bet.ticker);
    let closePrice = bet.entryPrice;
    let maxHigh = bet.entryPrice;
    let minLow = bet.entryPrice;

    try {
      const candles = await getHistorical(yfTicker, bet.callDate);
      if (candles.length > 0) {
        maxHigh = Math.max(...candles.map((c) => c.high));
        minLow = Math.min(...candles.map((c) => c.low));
        closePrice = candles[candles.length - 1].close;
      } else {
        const quote = await getQuote(yfTicker);
        closePrice = quote.price;
        maxHigh = quote.price;
        minLow = quote.price;
      }
    } catch (e) {
      console.warn(`[evaluate-bets] Could not fetch market candles for ${yfTicker}, using quote:`, e);
      try {
        const quote = await getQuote(yfTicker);
        closePrice = quote.price;
        maxHigh = quote.price;
        minLow = quote.price;
      } catch {
        console.error(`[evaluate-bets] Complete failure fetching price for ${yfTicker}. Preserving entry price.`);
      }
    }

    const returnPct = Number(
      (((closePrice - bet.entryPrice) / bet.entryPrice) * 100).toFixed(2),
    );

    let outcome: 'hit' | 'miss';
    if (bet.action === 'buy') {
      // Hit if reached or crossed target at any point during holding window, or at expiry
      if (maxHigh >= bet.targetPrice || closePrice >= bet.targetPrice) {
        outcome = 'hit';
      } else {
        outcome = 'miss';
      }
    } else {
      // Sell / Short
      if (minLow <= bet.targetPrice || closePrice <= bet.targetPrice) {
        outcome = 'hit';
      } else {
        outcome = 'miss';
      }
    }

    let postMortem: PostMortem | undefined = undefined;
    if (outcome === 'miss') {
      postMortem = await generatePostMortem(bet, closePrice, returnPct, maxHigh, minLow);
      misses++;
    } else {
      hits++;
    }

    const settled = await settleBet(bet.id, {
      closePrice,
      closedOn: todayStr,
      outcome,
      postMortem,
    });

    settledList.push(settled);
    console.log(
      `[evaluate-bets] Settled ${bet.ticker} (${bet.horizon}): ${outcome.toUpperCase()} (Entry: ₹${bet.entryPrice} -> Close: ₹${closePrice}, Return: ${returnPct}%)`,
    );
  }

  console.log(
    `[evaluate-bets] Evaluation complete. ${expiring.length} evaluated: ${hits} hits, ${misses} misses.`,
  );

  return {
    evaluated: expiring.length,
    hits,
    misses,
    settled: settledList,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  evaluateExpiringBets()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[evaluate-bets] Fatal execution error:', err);
      process.exit(1);
    });
}
