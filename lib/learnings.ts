import type { GradedBet, LearningLoop } from './schemas';

function sentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function learningNote(bet: GradedBet): string {
  const name = bet.name || bet.ticker.replace(/\.(NS|BO)$/, '');
  const thesis = sentence(bet.thesis);
  const note = sentence(bet.note);
  const outcome =
    bet.outcome === 'hit'
      ? 'worked'
      : bet.outcome === 'partial'
        ? 'only partially worked'
        : 'did not work';

  return `${name}: ${thesis} This ${outcome}${note ? ` ${note}` : ''}`;
}

export function buildLearningLoop(graded: GradedBet[]): LearningLoop {
  return {
    worked: graded.filter((bet) => bet.outcome === 'hit').map(learningNote),
    missed: graded.filter((bet) => bet.outcome !== 'hit').map(learningNote),
  };
}
