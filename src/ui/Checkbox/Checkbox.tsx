import {useId, type ReactNode} from 'react';
import {cx} from '../internal/cx';

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visible label; the whole row is clickable (>= 44 px on touch). */
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/** Native checkbox with a label row; used for multi-select lists (e.g. sources). */
export function Checkbox({checked, onCheckedChange, label, description, disabled, id: idProp, className}: CheckboxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const descId = `${id}-desc`;
  return (
    <label
      htmlFor={id}
      className={cx(
        'flex items-start gap-3 py-2 pointer-coarse:min-h-11',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-describedby={description ? descId : undefined}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 cursor-[inherit] rounded-small accent-primary"
      />
      <span className="flex min-w-0 flex-col">
        <span className="text-label text-strong">{label}</span>
        {description ? (
          <span id={descId} className="text-small text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
