import { readManifest, readReport } from './storage';
import { getHistorical } from './market-data';
import { generateGroundedObject } from './llm';
import { RecapContentSchema, type RecapContent, type ReportType } from './schemas';

export interface RecapInput {
  type: Extract<ReportType, 'weekly' | 'monthly'>;
  period: string; // '2026-W24' | '2026-06'
  periodLabel: string; // human label, e.g. 'week ending 2026-06-14'
  lookbackPeriod1: string; // YYYY-MM-DD to fetch actual moves from
  now: Date;
}

function pctMove(closes: number[]): number | null {
  if (closes.length < 2) return null;
  const first = closes[0];
  const last = closes[closes.length - 1];
  if (!first) return null;
  return ((last - first) / first) * 100;
}

export async function buildRecap(input: RecapInput): Promise<RecapContent> {
  const manifest = await readManifest();
  const prevId = manifest.latest[input.type];

  let priorReportJson = 'None — this is the first report of this kind.';
  let priorTickers: string[] = [];
  if (prevId) {
    const prev = await readReport(prevId);
    priorReportJson = JSON.stringify(prev.content);
    const content = prev.content as Partial<RecapContent>;
    const fromWatch = content?.outlook?.stocksToWatch?.map((s) => s.ticker) ?? [];
    const rec = content?.outlook?.recommendation?.ticker;
    priorTickers = [...new Set([...fromWatch, ...(rec ? [rec] : [])])];
  }

  const actualsLines: string[] = [];
  for (const ticker of priorTickers) {
    try {
      const candles = await getHistorical(ticker, input.lookbackPeriod1);
      const move = pctMove(candles.map((c) => c.close));
      actualsLines.push(
        `${ticker}: ${move === null ? 'no data' : `${move >= 0 ? '+' : ''}${move.toFixed(1)}% over the period`}`,
      );
    } catch {
      actualsLines.push(`${ticker}: price data unavailable`);
    }
  }
  const actualsBlock = actualsLines.length ? actualsLines.join('\n') : 'No prior calls to verify.';

  const researchPrompt =
    `You are reviewing Indian market (NSE/BSE) performance for the ${input.periodLabel}. ` +
    `Using current news and market context, assess what happened and what to expect next.\n\n` +
    `Previous ${input.type} report (JSON):\n${priorReportJson}\n\n` +
    `Actual price moves of previously-mentioned tickers over the period:\n${actualsBlock}`;

  const buildStructurePrompt = (research: string) =>
    `Produce a structured ${input.type} recap for period ${input.period}.\n` +
    (prevId
      ? `In "retrospective", evaluate each call the previous report made: hit (true/false) and why; set hits/total accordingly.\n`
      : `There is no previous report, so set "retrospective" to null.\n`) +
    `In "outlook": themes, up to 5 stocks to watch (each with signal), and one recommendation (buy/sell/hold, confidence 0..1).\n\n` +
    `Research:\n${research}`;

  const { object } = await generateGroundedObject(researchPrompt, buildStructurePrompt, RecapContentSchema);
  const content: RecapContent = {
    ...object,
    period: input.period,
    retrospective: prevId ? object.retrospective : null,
  };
  return RecapContentSchema.parse(content);
}
