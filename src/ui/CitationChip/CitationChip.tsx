import type {ComponentProps} from 'react';
import {cx} from '../internal/cx';

export interface CitationChipProps extends Omit<ComponentProps<'button'>, 'children' | 'type'> {
  /** Citation number shown in mono, e.g. 1 → "1". */
  n: number | string;
  /** Marks the chip whose source is currently inspected. */
  active?: boolean;
}

/**
 * Citation marker: mono number on the highlighter background (always dark
 * text). Renders a `<button>` when `onClick` is set, otherwise a `<span>`.
 */
export function CitationChip({n, active, className, onClick, ...rest}: CitationChipProps) {
  const cls = cx(
    'inline-flex h-5 min-w-5 items-center justify-center rounded-small border border-transparent bg-highlight px-1',
    'align-baseline font-mono text-caption font-medium leading-none text-highlight-ink',
    onClick && 'cursor-pointer transition-[box-shadow,translate] duration-[120ms] hover:-translate-x-px hover:-translate-y-px hover:shadow-offset',
    active && 'border-ink shadow-offset',
    className,
  );
  if (!onClick) {
    return <span className={cls}>{n}</span>;
  }
  return (
    <button type="button" aria-label={`Fuente ${n}`} {...rest} onClick={onClick} className={cls}>
      {n}
    </button>
  );
}
