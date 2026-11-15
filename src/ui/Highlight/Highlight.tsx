import type {ReactNode} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {cx} from '../internal/cx';

export interface HighlightProps {
  children: ReactNode;
  /** Seconds before the sweep starts. */
  delay?: number;
  /** Sweep when scrolled into view (default) or immediately on mount. */
  trigger?: 'view' | 'mount';
  className?: string;
}

const STRIPE = 'linear-gradient(var(--mia-highlight), var(--mia-highlight))';

/**
 * Inline highlighter: the marker sweeps left to right (background-size 0 → 100%)
 * behind dark text. The highlight is a background only; text is always
 * `--mia-highlight-ink`, in both themes. Wraps across lines (`box-decoration-clone`).
 */
export function Highlight({children, delay = 0, trigger = 'view', className}: HighlightProps) {
  const reduced = useReducedMotion();
  const common = {
    className: cx('box-decoration-clone px-[0.2em] text-highlight-ink [background-repeat:no-repeat]', className),
    style: {backgroundImage: STRIPE},
  };
  if (reduced) {
    return <span {...common} style={{...common.style, backgroundSize: '100% 100%'}}>{children}</span>;
  }
  const target = {backgroundSize: '100% 100%'};
  return (
    <motion.span
      {...common}
      initial={{backgroundSize: '0% 100%'}}
      {...(trigger === 'view'
        ? {whileInView: target, viewport: {once: true, margin: '-10% 0px'}}
        : {animate: target})}
      transition={{duration: 0.55, delay, ease: [0.16, 1, 0.3, 1]}}
    >
      {children}
    </motion.span>
  );
}
