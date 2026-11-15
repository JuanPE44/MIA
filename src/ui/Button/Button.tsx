import {useId, type ComponentProps, type MouseEvent, type ReactNode} from 'react';
import {cx, HIT_44} from '../internal/cx';
import {Spinner} from '../Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Shows a spinner instead of the leading icon; keeps the label; sets `aria-busy`. */
  loading?: boolean;
  /** Round pill shape (Bienvenida / session start). */
  pill?: boolean;
  /** Stretches to the container width (phone dialogs, form footers). */
  fullWidth?: boolean;
  /**
   * Explains why the button is disabled. When set together with `disabled`,
   * the button stays focusable (`aria-disabled`) and exposes the reason.
   */
  disabledReason?: string;
  children?: ReactNode;
}

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-control bg-surface text-strong hover:border-ink hover:bg-subtle',
  // Highlighter underline sweeps in on hover (decorative stripe below the label)
  ghost: cx(
    'bg-transparent text-default bg-no-repeat [background-image:linear-gradient(var(--mia-highlight),var(--mia-highlight))]',
    '[background-position:center_calc(100%-5px)] [background-size:0%_4px] hover:[background-size:calc(100%-1.5rem)_4px]',
    'transition-[background-size] duration-[var(--mia-duration-sweep)] ease-[var(--mia-ease-out)]',
  ),
  danger: 'bg-danger text-page hover:opacity-90',
  'danger-ghost': 'bg-transparent text-danger hover:bg-danger-tint',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-control-sm gap-2 px-3 text-label',
  md: 'h-control-md gap-2 px-4 text-label',
  lg: 'h-control-lg gap-2 px-5 text-body-strong',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  loading = false,
  pill = false,
  fullWidth = false,
  disabledReason,
  disabled,
  type = 'button',
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  const reasonId = useId();
  const softDisabled = Boolean(disabled && disabledReason);
  const blocked = softDisabled || loading;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (blocked) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      {...rest}
      type={type}
      // Soft-disabled / loading buttons remain focusable; hard-disabled use the attribute.
      disabled={disabled && !softDisabled}
      aria-disabled={softDisabled || undefined}
      aria-busy={loading || undefined}
      aria-describedby={cx(rest['aria-describedby'], softDisabled && reasonId) || undefined}
      title={softDisabled ? disabledReason : rest.title}
      onClick={handleClick}
      className={cx(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-sans',
        'transition-[background-color,transform,box-shadow] duration-[120ms] active:scale-[0.98]',
        pill ? 'rounded-pill' : 'rounded-control',
        HIT_44,
        sizes[size],
        buttonVariants[variant],
        fullWidth && 'w-full',
        (disabled || softDisabled) && 'opacity-40',
        (disabled || blocked) && 'cursor-not-allowed active:scale-100',
        className,
      )}
    >
      {loading ? <Spinner size={20} className="text-current" /> : leadingIcon}
      {children}
      {trailingIcon}
      {softDisabled ? (
        <span id={reasonId} className="sr-only">
          {disabledReason}
        </span>
      ) : null}
    </button>
  );
}
