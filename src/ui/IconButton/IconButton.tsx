import type {ComponentProps, ReactNode} from 'react';
import {cx, HIT_44} from '../internal/cx';
import {Spinner} from '../Spinner';

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children' | 'aria-label'> {
  /** Required: icon-only buttons need an accessible name (also used as tooltip). */
  'aria-label': string;
  icon: ReactNode;
  variant?: 'ghost' | 'secondary' | 'primary';
  size?: 'sm' | 'md';
  loading?: boolean;
  /** Shows the label as a CSS tooltip on hover/focus (desktop). Default true. */
  tooltip?: boolean;
}

const variants = {
  ghost: 'bg-transparent text-default hover:bg-subtle rounded-control',
  secondary: 'border border-control bg-surface text-strong hover:bg-subtle rounded-control',
  primary: 'bg-primary text-on-primary hover:bg-primary-hover rounded-pill',
} as const;

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  tooltip = true,
  type = 'button',
  className,
  disabled,
  onClick,
  'aria-label': ariaLabel,
  ...rest
}: IconButtonProps) {
  return (
    <span className="group relative inline-flex">
      <button
        {...rest}
        type={type}
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        disabled={disabled}
        onClick={(e) => {
          if (loading) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        className={cx(
          'inline-flex items-center justify-center transition-colors duration-[120ms]',
          'active:scale-[0.98]',
          HIT_44,
          size === 'md' ? 'size-control-md' : 'size-control-sm',
          variants[variant],
          disabled && 'cursor-not-allowed opacity-40',
          className,
        )}
      >
        {loading ? <Spinner size={20} className="text-current" /> : icon}
      </button>
      {tooltip ? (
        <span
          aria-hidden
          className={cx(
            // Hidden (display:none) until hover/focus so it never widens the page;
            // anchored to the right edge so it grows leftwards (no right overflow).
            'pointer-events-none absolute right-0 w-max top-full z-30 mt-1 whitespace-nowrap hidden',
            'rounded-small bg-strong px-2 py-1 text-caption text-page',
            'pointer-coarse:!hidden',
            'group-hover:block group-has-[:focus-visible]:block',
          )}
        >
          {ariaLabel}
        </span>
      ) : null}
    </span>
  );
}
