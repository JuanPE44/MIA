import {motion, useReducedMotion} from 'motion/react';
import {cx} from '../internal/cx';

export interface InkMarkProps {
  className?: string;
  /** Seconds before the stroke starts drawing. */
  delay?: number;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Hand-drawn ink underline. Draws left to right on mount (static when motion is
 * reduced). Color follows `currentColor`; place it under a title.
 */
export function InkUnderline({className, delay = 0.2}: InkMarkProps) {
  const reduced = useReducedMotion();
  return (
    <svg aria-hidden viewBox="0 0 180 12" preserveAspectRatio="none" className={cx('h-2.5 w-full', className)} fill="none">
      <motion.path
        d="M3 8.5C28 3 52 11 84 6.5S142 3.5 177 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        // Reveal with a clip, not pathLength: dash arrays are normalized in viewBox
        // units but drawn in screen units under non-scaling-stroke, which leaves a gap
        // when the SVG is stretched wider than its viewBox.
        initial={reduced ? false : {clipPath: 'inset(0 100% 0 0)'}}
        animate={{clipPath: 'inset(0 0% 0 0)'}}
        transition={{duration: 0.7, delay, ease: EASE}}
      />
    </svg>
  );
}

/**
 * Highlighter smear: a slightly irregular marker stroke in `--mia-highlight`.
 * Decorative background only; never place text on top of it other than
 * `--mia-highlight-ink`.
 */
export function HighlightStroke({className, delay = 0.1}: InkMarkProps) {
  const reduced = useReducedMotion();
  return (
    <svg aria-hidden viewBox="0 0 200 56" preserveAspectRatio="none" className={cx('h-14 w-48', className)}>
      <motion.path
        d="M6 20C44 7 122 5 195 13L191 41C130 47 52 49 9 42Z"
        fill="var(--mia-highlight)"
        initial={reduced ? false : {clipPath: 'inset(0 100% 0 0)'}}
        animate={{clipPath: 'inset(0 0% 0 0)'}}
        transition={{duration: 0.6, delay, ease: EASE}}
      />
    </svg>
  );
}
