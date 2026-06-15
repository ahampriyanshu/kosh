import { describe, it, expect, vi } from 'vitest';
const newsSlice = {
  news: [{ category: 'macro_policy', items: [{ headline: 'RBI holds rates', summary: '...', source: 'ET', sentiment: 'neutral' }] }],
  streetRecommendations: [{ ticker: 'TCS.NS', name: 'TCS', brokerage: 'Morgan', action: 'buy', target: 4200, rationale: '...' }],
};
vi.mock('../../../lib/llm', () => ({
  generateGroundedObject: vi.fn(async () => ({ object: newsSlice, sources: [] })),
}));
import { fetchNews } from '../../../lib/feed/news';
import { NewsSliceSchema } from '../../../lib/schemas';

describe('fetchNews', () => {
  it('returns a schema-valid news slice from grounded output', async () => {
    const slice = await fetchNews();
    expect(() => NewsSliceSchema.parse(slice)).not.toThrow();
    expect(slice.news[0].category).toBe('macro_policy');
  });
});
