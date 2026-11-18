import type {CSSProperties} from 'react';
import {cx} from '../internal/cx';
import '../ui.css';

export interface SkeletonProps {
  /** `text` is a rounded line, `block` a card-like rectangle, `circle` an avatar. */
  shape?: 'text' | 'block' | 'circle';
  className?: string;
  style?: CSSProperties;
}

/**
 * Decorative placeholder shown while content loads. Size it with classes
 * (`h-3 w-4/5`). Hidden from assistive tech: pair it with a labelled
 * `role="status"` / `aria-busy` container.
 */
export function Skeleton({shape = 'text', className, style}: SkeletonProps) {
  return (
    <div
      aria-hidden
      style={style}
      className={cx(
        'mia-skeleton',
        shape === 'text' && 'h-3 rounded-pill',
        shape === 'block' && 'rounded-card border border-rule',
        shape === 'circle' && 'rounded-pill',
        className,
      )}
    />
  );
}
