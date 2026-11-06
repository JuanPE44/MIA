import {useId, type ReactNode} from 'react';
import {cx} from '../internal/cx';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visible label; the whole row is clickable. Use `aria-label` when the label is visually hidden. */
  label?: ReactNode;
  'aria-label'?: string;
  description?: ReactNode;
  labelPosition?: 'left' | 'right';
  disabled?: boolean;
  /** Reason shown to assistive tech when disabled (the switch stays focusable). */
  disabledReason?: string;
  id?: string;
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  labelPosition = 'right',
  disabled,
  disabledReason,
  id: idProp,
  className,
  'aria-label': ariaLabel,
}: SwitchProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const labelId = `${id}-label`;
  const descId = `${id}-desc`;
  const reasonId = `${id}-reason`;
  const soft = Boolean(disabled && disabledReason);

  const control = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : ariaLabel}
      aria-labelledby={label ? labelId : undefined}
      aria-describedby={cx(description ? descId : null, soft && reasonId) || undefined}
      aria-disabled={soft || undefined}
      disabled={disabled && !soft}
      onClick={() => {
        if (disabled) return;
        onCheckedChange(!checked);
      }}
      className={cx(
        'relative inline-block h-6 w-10 shrink-0 rounded-pill transition-colors duration-[120ms]',
        checked ? 'bg-primary' : 'bg-transparent shadow-[inset_0_0_0_2px_var(--mia-border-control)]',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      <span
        aria-hidden
        className={cx(
          'absolute top-0.5 size-5 rounded-pill transition-[left] duration-[120ms]',
          checked ? 'left-[18px] bg-on-primary' : 'left-0.5 bg-control',
        )}
      />
      {soft ? (
        <span id={reasonId} className="sr-only">
          {disabledReason}
        </span>
      ) : null}
    </button>
  );

  if (!label) return control;

  // The wrapping <label> makes the whole row activate the switch (hit >= 44 on touch).
  return (
    <label
      title={soft ? disabledReason : undefined}
      className={cx(
        'flex items-center gap-3 pointer-coarse:min-h-11',
        labelPosition === 'left' && 'flex-row-reverse justify-between',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      )}
    >
      {control}
      <span className="flex min-w-0 flex-col">
        <span id={labelId} className="text-label text-strong">
          {label}
        </span>
        {description ? (
          <span id={descId} className="text-small text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
