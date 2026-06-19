import { generateGroundedObject } from '../llm';
import { FlowsSliceSchema, type FlowsSlice } from '../schemas';

export async function fetchFlows(now: Date = new Date()): Promise<FlowsSlice> {
  const date = now.toISOString().slice(0, 10);
  const researchPrompt =
    `Research, for the most recent Indian trading session before ${date}: ` +
    `1) FII and DII net cash-market activity in INR crore (with the date they apply to); ` +
    `2) the India 10-year government bond yield and its change in basis points; ` +
    `3) upcoming corporate actions (results, dividends, splits, AGMs, bonus) for major NSE stocks in the next ~2 weeks.`;
  const buildStructurePrompt = (research: string) =>
    `From the research produce: "fiiDii": { fiiNet (number, crore), diiNet (number, crore), unit: "crore", asOf (YYYY-MM-DD) } or null if unknown; ` +
    `"giftNifty": null; "bondYield": { name: "India 10Y", value, changeBps } or null; ` +
    `"corporateActions": array of { ticker (NSE symbol), name, type (results/dividend/split/agm/bonus), date (YYYY-MM-DD) }. ` +
    `Use null / empty array for anything you cannot source.\n\nResearch:\n${research}`;
  const { object } = await generateGroundedObject(researchPrompt, buildStructurePrompt, FlowsSliceSchema);
  return { ...object, giftNifty: null };
}
