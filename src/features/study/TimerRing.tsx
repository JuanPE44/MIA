import {formatClock} from './sessionMachine';

interface TimerRingProps {
  remainingSeconds: number;
  totalSeconds: number;
  /** `study` draws the ring in primary, breaks in success. */
  tone: 'study' | 'break';
}

const SIZE = 280;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

/** Circular timer (component-specifications §6.8): 280px, 220px on phones. */
export function TimerRing({remainingSeconds, totalSeconds, tone}: TimerRingProps) {
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds)) : 0;
  return (
    <div className="relative mx-auto size-[220px] sm:size-[280px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" aria-hidden>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-hairline" />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - progress)}
          className={tone === 'study' ? 'stroke-primary' : 'stroke-success'}
        />
      </svg>
      <div
        role="timer"
        aria-label="Tiempo restante"
        className="absolute inset-0 flex items-center justify-center text-timer tabular-nums text-strong"
      >
        {formatClock(remainingSeconds)}
      </div>
    </div>
  );
}
