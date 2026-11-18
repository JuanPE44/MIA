import {useRef, type KeyboardEvent, type ReactNode} from 'react';
import {cx, HIT_44} from '../internal/cx';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

interface BaseProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  fullWidth?: boolean;
}

// An accessible name is mandatory for a radiogroup.
export type SegmentedControlProps<T extends string> = BaseProps<T> &
  ({'aria-label': string} | {'aria-labelledby': string});

export function SegmentedControl<T extends string>(props: SegmentedControlProps<T>) {
  const {options, value, onValueChange, className, fullWidth} = props;
  const refs = useRef(new Map<T, HTMLButtonElement>());
  const enabled = options.filter((o) => !o.disabled);
  const selectedEnabled = enabled.some((o) => o.value === value);
  // Roving tabindex: the selected option, or the first enabled one if none is.
  const tabStop = selectedEnabled ? value : enabled[0]?.value;

  const move = (to: SegmentedOption<T> | undefined) => {
    if (!to) return;
    onValueChange(to.value);
    refs.current.get(to.value)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const idx = enabled.findIndex((o) => o.value === value);
    const at = idx === -1 ? 0 : idx;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        move(enabled[(at + 1) % enabled.length]);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        move(enabled[(at - 1 + enabled.length) % enabled.length]);
        break;
      case 'Home':
        e.preventDefault();
        move(enabled[0]);
        break;
      case 'End':
        e.preventDefault();
        move(enabled[enabled.length - 1]);
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={'aria-label' in props ? props['aria-label'] : undefined}
      aria-labelledby={'aria-labelledby' in props ? props['aria-labelledby'] : undefined}
      onKeyDown={onKeyDown}
      className={cx(
        'inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-pill bg-subtle p-1',
        fullWidth && 'flex w-full [&>button]:flex-1',
        className,
      )}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={(node) => {
              if (node) refs.current.set(o.value, node);
              else refs.current.delete(o.value);
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={o.disabled}
            tabIndex={o.value === tabStop ? 0 : -1}
            onClick={() => onValueChange(o.value)}
            className={cx(
              'inline-flex h-control-sm shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill px-2.5 text-label sm:px-3',
              'transition-colors duration-[120ms]',
              HIT_44,
              selected ? 'bg-surface text-strong shadow-elevation-1' : 'text-muted hover:text-strong',
              o.disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            {o.icon ? <span aria-hidden className="[&>svg]:size-4">{o.icon}</span> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
