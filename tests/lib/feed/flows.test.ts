import { describe, it, expect, vi } from 'vitest';
const flowsSlice = {
  fiiDii: { fiiNet: -1200.5, diiNet: 980.2, unit: 'crore', asOf: '2026-06-14' },
  corporateActions: [{ ticker: 'INFY.NS', name: 'Infosys', type: 'results', date: '2026-06-18' }],
  giftNifty: { value: 23650, changePct: 0.2 },
  bondYield: { name: 'India 10Y', value: 6.98, changeBps: -2 },
};
vi.mock('../../../lib/llm', () => ({
  generateGroundedObject: vi.fn(async () => ({ object: flowsSlice, sources: [] })),
}));
import { fetchFlows } from '../../../lib/feed/flows';
import { FlowsSliceSchema } from '../../../lib/schemas';

describe('fetchFlows', () => {
  it('returns a schema-valid flows slice and discards LLM-sourced GIFT Nifty', async () => {
    const slice = await fetchFlows();
    expect(() => FlowsSliceSchema.parse(slice)).not.toThrow();
    expect(slice.fiiDii?.unit).toBe('crore');
    expect(slice.giftNifty).toBeNull();
  });
});
