import {motion, useReducedMotion} from 'motion/react';
import {cx} from '../internal/cx';

export interface ConfettiProps {
  /** Number of dots (default 18). */
  count?: number;
  className?: string;
}

const COLORS = ['var(--mia-highlight)', 'var(--mia-primary)', 'var(--mia-ink)', 'var(--mia-success)'] as const;

/** Deterministic pseudo-random in [0, 1) so the burst is stable across renders. */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * One-shot burst of small ink dots radiating from the center of its (relative)
 * parent. Decorative; renders nothing when the user prefers reduced motion.
 */
export function Confetti({count = 18, className}: ConfettiProps) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div aria-hidden className={cx('pointer-events-none absolute inset-0 flex items-center justify-center', className)}>
      {Array.from({length: count}, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + rand(i, 1) * 0.5;
        const dist = 90 + rand(i, 2) * 90;
        const size = 6 + Math.round(rand(i, 3) * 6);
        return (
          <motion.span
            key={i}
            className="absolute rounded-pill border border-ink/30"
            style={{width: size, height: size, backgroundColor: COLORS[i % COLORS.length]}}
            initial={{x: 0, y: 0, opacity: 0, scale: 0.4}}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist + 24,
              opacity: [0, 1, 1, 0],
              scale: [0.4, 1, 1, 0.8],
            }}
            transition={{duration: 1.3 + rand(i, 4) * 0.5, delay: 0.25 + rand(i, 5) * 0.15, ease: [0.16, 1, 0.3, 1]}}
          />
        );
      })}
    </div>
  );
}
