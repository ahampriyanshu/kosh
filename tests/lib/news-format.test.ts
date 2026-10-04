import { describe, expect, it } from 'vitest';
import {
  cleanSource,
  formatCategory,
  formatNewsMeta,
  safeArticleUrl,
  cleanTicker,
} from '../../src/lib/news-format';

describe('news-format utility', () => {
  describe('cleanSource', () => {
    it('returns valid publication names', () => {
      expect(cleanSource('Economic Times')).toBe('Economic Times');
      expect(cleanSource('Reuters')).toBe('Reuters');
      expect(cleanSource('Bloomberg')).toBe('Bloomberg');
    });

    it('filters out placeholder or missing sources', () => {
      expect(cleanSource('')).toBeUndefined();
      expect(cleanSource('   ')).toBeUndefined();
      expect(cleanSource('research text')).toBeUndefined();
      expect(cleanSource('research')).toBeUndefined();
      expect(cleanSource('source')).toBeUndefined();
      expect(cleanSource('n/a')).toBeUndefined();
      expect(cleanSource('unknown')).toBeUndefined();
      expect(cleanSource(undefined)).toBeUndefined();
    });
  });

  describe('formatCategory', () => {
    it('maps known snake_case categories to title labels', () => {
      expect(formatCategory('macro_policy')).toBe('Macro & Policy');
      expect(formatCategory('global_cues')).toBe('Global Cues');
      expect(formatCategory('earnings')).toBe('Earnings');
      expect(formatCategory('sectoral')).toBe('Sectoral');
      expect(formatCategory('corporate_actions')).toBe('Corporate Actions');
      expect(formatCategory('stocks_in_focus')).toBe('Stocks in Focus');
    });

    it('preserves already formatted categories', () => {
      expect(formatCategory('Macro & Policy')).toBe('Macro & Policy');
      expect(formatCategory('Capital Goods')).toBe('Capital Goods');
    });

    it('formats unmapped snake_case keys into Title Case', () => {
      expect(formatCategory('special_report')).toBe('Special Report');
    });
  });

  describe('formatNewsMeta', () => {
    it('formats category - source line correctly', () => {
      expect(formatNewsMeta('macro_policy', 'Economic Times')).toBe('Macro & Policy - Economic Times');
      expect(formatNewsMeta('Macro & Policy', 'Economic Times')).toBe('Macro & Policy - Economic Times');
    });

    it('falls back to category when source is absent or placeholder', () => {
      expect(formatNewsMeta('macro_policy', 'research text')).toBe('Macro & Policy');
      expect(formatNewsMeta('macro_policy', '')).toBe('Macro & Policy');
      expect(formatNewsMeta('macro_policy', undefined)).toBe('Macro & Policy');
    });

    it('falls back to source when category is absent', () => {
      expect(formatNewsMeta('', 'Reuters')).toBe('Reuters');
      expect(formatNewsMeta(undefined, 'Bloomberg')).toBe('Bloomberg');
    });
  });

  describe('safeArticleUrl', () => {
    it('allows valid http/https URLs', () => {
      expect(safeArticleUrl('https://economictimes.indiatimes.com/news')).toBe(
        'https://economictimes.indiatimes.com/news',
      );
      expect(safeArticleUrl('http://example.com/story')).toBe('http://example.com/story');
    });

    it('rejects invalid or unsafe schemes', () => {
      expect(safeArticleUrl('javascript:alert(1)')).toBeUndefined();
      expect(safeArticleUrl('file:///etc/passwd')).toBeUndefined();
      expect(safeArticleUrl('not-a-url')).toBeUndefined();
      expect(safeArticleUrl('')).toBeUndefined();
      expect(safeArticleUrl(undefined)).toBeUndefined();
    });
  });

  describe('cleanTicker', () => {
    it('strips .NS and .BO suffixes', () => {
      expect(cleanTicker('TCS.NS')).toBe('TCS');
      expect(cleanTicker('INFY.BO')).toBe('INFY');
      expect(cleanTicker('HDFCBANK')).toBe('HDFCBANK');
    });
  });
});
