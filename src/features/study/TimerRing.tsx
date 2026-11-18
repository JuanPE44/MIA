import {formatClock} from './sessionMachine';

interface TimerRingProps {
  remainingSeconds: number;
  totalSeconds: number;
  /** `study` draws the ring in primary, breaks in success. */
  tone: 'study' | 'break';
}

const SIZE = 320;
const STROKE = 12;
const RADIUS = (SIZE - STROKE - 8) / 2;
const CIRC = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;
// One tick per second: a linear 1s transition makes the stroke glide instead of stepping.
const GLIDE = 'stroke-dashoffset 1s linear, transform 1s linear';

/** Circular timer: 320px (240px on phones), gliding stroke, highlighter nib at the leading edge. */
export function TimerRing({remainingSeconds, totalSeconds, tone}: TimerRingProps) {
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds)) : 0;
  return (
    <div className="relative mx-auto size-60 sm:size-80">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" aria-hidden>
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-rule" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - progress)}
          style={{transition: GLIDE}}
          className={tone === 'study' ? 'stroke-primary' : 'stroke-success'}
        />
        {progress > 0 ? (
          <g style={{transform: `rotate(${progress * 360}deg)`, transformOrigin: `${CENTER}px ${CENTER}px`, transition: GLIDE}}>
            <circle cx={CENTER + RADIUS} cy={CENTER} r={STROKE / 2 + 3} className="fill-highlight stroke-ink" strokeWidth={1.5} />
          </g>
        ) : null}
      </svg>
      <div
        role="timer"
        aria-label="Tiempo restante"
        className="absolute inset-0 flex items-center justify-center font-mono text-timer font-medium tabular-nums text-strong sm:text-[5rem] sm:leading-none"
      >
        {formatClock(remainingSeconds)}
      </div>
    </div>
  );
}
