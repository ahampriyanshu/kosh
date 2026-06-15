import type { Bet } from './schemas';

const DEAD_BAND = 1; // percent

export function gradeBet(bet: Bet, entryRef: number, exitRef: number): { changePct: number; outcome: 'hit' | 'miss' | 'partial' } {
  if (!entryRef) return { changePct: 0, outcome: 'partial' };
  const changePct = Number((((exitRef - entryRef) / entryRef) * 100).toFixed(2));
  let outcome: 'hit' | 'miss' | 'partial';
  if (bet.action === 'buy') {
    outcome = changePct >= DEAD_BAND ? 'hit' : changePct <= -DEAD_BAND ? 'miss' : 'partial';
  } else if (bet.action === 'sell') {
    outcome = changePct <= -DEAD_BAND ? 'hit' : changePct >= DEAD_BAND ? 'miss' : 'partial';
  } else {
    outcome = Math.abs(changePct) < DEAD_BAND ? 'hit' : 'miss';
  }
  return { changePct, outcome };
}
