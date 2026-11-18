import type {ReactNode} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';

export interface PageTransitionProps {
  /** Changing this key plays the exit/enter transition between the old and new children. */
  transitionKey: string;
  children: ReactNode;
  className?: string;
  /**
   * Also rise 6px on enter (default). Turn off for wrappers that contain
   * `position: fixed` descendants: a transform would re-anchor them mid-animation.
   */
  lift?: boolean;
}

const EASE = [0.2, 0, 0, 1] as const;

/**
 * Fast fade + 6px rise between screens (exit 70ms, enter 130ms: never above
 * 200ms in total). The old screen is held until its exit completes
 * (`mode="wait"`), so two screens never stack and the layout does not jump.
 * Plain pass-through when the user prefers reduced motion.
 */
export function PageTransition({transitionKey, children, className, lift = true}: PageTransitionProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        className={className}
        initial={{opacity: 0, ...(lift ? {y: 6} : {})}}
        animate={{opacity: 1, ...(lift ? {y: 0} : {}), transition: {duration: 0.13, ease: EASE}}}
        exit={{opacity: 0, transition: {duration: 0.07, ease: EASE}}}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
