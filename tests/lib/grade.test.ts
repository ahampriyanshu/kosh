import { describe, it, expect } from 'vitest';
import { gradeBet } from '../../lib/grade';
import type { Bet } from '../../lib/schemas';

const bet = (action: Bet['action']): Bet => ({ ticker: 'X.NS', name: 'X', thesis: 't', action, signal: 'bullish', confidence: 0.6 });

describe('gradeBet', () => {
  it('buy: up beyond dead-band is a hit', () => {
    const r = gradeBet(bet('buy'), 100, 105);
    expect(r.outcome).toBe('hit');
    expect(r.changePct).toBeCloseTo(5, 5);
  });
  it('buy: down beyond dead-band is a miss', () => {
    expect(gradeBet(bet('buy'), 100, 95).outcome).toBe('miss');
  });
  it('buy: inside the 1% dead-band is partial', () => {
    expect(gradeBet(bet('buy'), 100, 100.5).outcome).toBe('partial');
  });
  it('sell: down is a hit, up is a miss', () => {
    expect(gradeBet(bet('sell'), 100, 95).outcome).toBe('hit');
    expect(gradeBet(bet('sell'), 100, 105).outcome).toBe('miss');
  });
  it('hold: flat is a hit, moving is a miss', () => {
    expect(gradeBet(bet('hold'), 100, 100.5).outcome).toBe('hit');
    expect(gradeBet(bet('hold'), 100, 110).outcome).toBe('miss');
  });
  it('zero/invalid entry price → partial, 0%', () => {
    const r = gradeBet(bet('buy'), 0, 105);
    expect(r.outcome).toBe('partial');
    expect(r.changePct).toBe(0);
  });
});
