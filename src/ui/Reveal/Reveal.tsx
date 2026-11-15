import type {ReactNode} from 'react';
import {motion, useReducedMotion, type Variants} from 'motion/react';

type Tag = 'div' | 'ul' | 'ol' | 'section' | 'li' | 'dl' | 'dt' | 'dd';

const TAGS = {div: motion.div, ul: motion.ul, ol: motion.ol, section: motion.section, li: motion.li, dl: motion.dl, dt: motion.dt, dd: motion.dd} as const;

export interface RevealProps {
  children: ReactNode;
  as?: Tag;
  /** Seconds between children (default 0.06). */
  stagger?: number;
  /** Seconds before the first child. */
  delay?: number;
  className?: string;
}

const container = (stagger: number, delay: number): Variants => ({
  hidden: {},
  show: {transition: {staggerChildren: stagger, delayChildren: delay}},
});

const item: Variants = {
  hidden: {opacity: 0, y: 12},
  show: {opacity: 1, y: 0, transition: {duration: 0.4, ease: [0.16, 1, 0.3, 1]}},
};

/** Staggered entrance container. Wrap children in `RevealItem`. No motion when reduced. */
export function Reveal({children, as = 'div', stagger = 0.06, delay = 0, className}: RevealProps) {
  const reduced = useReducedMotion();
  const Tag = TAGS[as] as typeof motion.div;
  if (reduced) {
    const Plain = as as 'div';
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Tag className={className} variants={container(stagger, delay)} initial="hidden" animate="show">
      {children}
    </Tag>
  );
}

export interface RevealItemProps {
  children: ReactNode;
  as?: Tag;
  className?: string;
}

/** Child of `Reveal`: fades and rises into place. */
export function RevealItem({children, as = 'div', className}: RevealItemProps) {
  const reduced = useReducedMotion();
  const Tag = TAGS[as] as typeof motion.div;
  if (reduced) {
    const Plain = as as 'div';
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Tag className={className} variants={item}>
      {children}
    </Tag>
  );
}
