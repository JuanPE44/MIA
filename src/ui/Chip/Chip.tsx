import type {ReactNode} from 'react';
import {cx} from '../internal/cx';
import {Icon} from '../Icon';

interface ChipBase {
  children: ReactNode;
  size?: 'sm' | 'md';
  icon?: ReactNode;
  className?: string;
}

export type ChipProps =
  | (ChipBase & {variant?: 'display' | 'outline'})
  | (ChipBase & {variant: 'selectable'; selected: boolean; onSelectedChange: (selected: boolean) => void})
  | (ChipBase & {variant: 'removable'; onRemove: () => void; removeLabel?: string});

export function Chip(props: ChipProps) {
  const {children, size = 'md', icon, className} = props;
  const variant = props.variant ?? 'display';
  const base = cx(
    'inline-flex items-center gap-1.5 rounded-pill px-3 text-label',
    size === 'sm' ? 'h-6' : 'h-7',
  );
  const iconEl = icon ? (
    <span aria-hidden className="[&>svg]:size-4">
      {icon}
    </span>
  ) : null;

  if (props.variant === 'selectable') {
    const {selected, onSelectedChange} = props;
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelectedChange(!selected)}
        className={cx(
          base,
          'relative border pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2 pointer-coarse:after:content-[""]',
          'transition-colors duration-[120ms]',
          selected
            ? 'border-ink bg-highlight text-highlight-ink'
            : 'border-rule bg-surface text-default hover:border-ink',
          className,
        )}
      >
        {selected ? <Icon name="check" weight="bold" className="size-4" /> : iconEl}
        {children}
      </button>
    );
  }

  if (props.variant === 'removable') {
    const {onRemove, removeLabel} = props;
    return (
      <span className={cx(base, 'bg-subtle pr-1 text-default', className)}>
        {iconEl}
        {children}
        <button
          type="button"
          aria-label={removeLabel ?? `Quitar ${typeof children === 'string' ? children : ''}`.trim()}
          onClick={onRemove}
          className={cx(
            'relative inline-flex size-5 items-center justify-center rounded-pill hover:bg-hairline',
            "pointer-coarse:after:absolute pointer-coarse:after:-inset-3 pointer-coarse:after:content-['']",
          )}
        >
          <Icon name="close" className="size-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span
      className={cx(
        base,
        variant === 'outline' ? 'border border-rule text-default' : 'bg-subtle text-default',
        className,
      )}
    >
      {iconEl}
      {children}
    </span>
  );
}
