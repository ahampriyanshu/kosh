import type { MoodSnapshot } from '../../lib/schemas';

interface SentimentGaugeProps {
  score: number;
  regime: MoodSnapshot['regime'];
  compact?: boolean;
}

const bands = [
  { label: 'Oversold', max: 25, color: '#34745b' },
  { label: 'Fear', max: 45, color: '#83a083' },
  { label: 'Balanced', max: 55, color: '#b9b6a5' },
  { label: 'Optimism', max: 75, color: '#d7a15d' },
  { label: 'Overbought', max: 100, color: '#bf5749' },
] as const;

export function getSentimentBand(score: number) {
  const boundedScore = Math.max(0, Math.min(100, score));
  return bands.find((band) => boundedScore <= band.max) ?? bands[bands.length - 1];
}

const centerX = 180;
const centerY = 166;
const radius = 122;

function pointAt(score: number, inset = 0) {
  const angle = Math.PI - (Math.max(0, Math.min(100, score)) / 100) * Math.PI;
  const r = radius - inset;
  return {
    x: centerX + Math.cos(angle) * r,
    y: centerY - Math.sin(angle) * r,
  };
}

function arcPath(start: number, end: number) {
  const startPoint = pointAt(start);
  const endPoint = pointAt(end);
  const largeArc = end - start > 50 ? 1 : 0;
  return `M ${startPoint.x.toFixed(2)} ${startPoint.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x.toFixed(2)} ${endPoint.y.toFixed(2)}`;
}

export function SentimentGauge({ score, regime, compact = false }: SentimentGaugeProps) {
  const boundedScore = Math.max(0, Math.min(100, score));
  const marker = pointAt(boundedScore);

  return (
    <figure className={`mx-auto w-full ${compact ? 'max-w-[300px]' : 'max-w-[440px]'}`} aria-label={`Sentiment Index: ${boundedScore} out of 100, ${regime}`}>
      <svg
        className="block h-auto w-full overflow-visible"
        viewBox="0 0 360 210"
        role="img"
        aria-labelledby="sentiment-gauge-title sentiment-gauge-description"
      >
        <title id="sentiment-gauge-title">{`Sentiment Index score: ${boundedScore} out of 100`}</title>
        <desc id="sentiment-gauge-description">{`The semicircle runs from oversold at zero in green to overbought at one hundred in red. The current reading is ${regime}.`}</desc>

        <defs>
          <linearGradient id="sentiment-gauge-gradient" gradientUnits="userSpaceOnUse" x1="58" y1="166" x2="302" y2="166">
            <stop offset="0%" stopColor="#34745b" />
            <stop offset="15%" stopColor="#83a083" />
            <stop offset="42.5%" stopColor="#b9b6a5" />
            <stop offset="57.5%" stopColor="#b9b6a5" />
            <stop offset="85%" stopColor="#d7a15d" />
            <stop offset="100%" stopColor="#bf5749" />
          </linearGradient>
        </defs>

        <path
          d={arcPath(0, 100)}
          fill="none"
          stroke="#eceae4"
          strokeWidth="19"
          strokeLinecap="round"
        />
        <path
          d={arcPath(0, 100)}
          fill="none"
          stroke="url(#sentiment-gauge-gradient)"
          strokeWidth="19"
          strokeLinecap="round"
        />

        <circle cx={marker.x} cy={marker.y} r="6.5" fill="#202622" />

        <text x="180" y="137" textAnchor="middle" fill="#202622" fontSize="48" fontWeight="600" fontFamily="var(--font-newsreader)">
          {boundedScore}
        </text>
        <text x="180" y="160" textAnchor="middle" fill="#737870" fontSize="12" fontWeight="600" letterSpacing="0.4" fontFamily="var(--font-newsreader)">
          {regime}
        </text>
        <text x="43" y="202" textAnchor="middle" fill="#71776f" fontSize="11" fontFamily="var(--font-newsreader)">Oversold</text>
        <text x="317" y="202" textAnchor="middle" fill="#71776f" fontSize="11" fontFamily="var(--font-newsreader)">Overbought</text>
      </svg>
    </figure>
  );
}
