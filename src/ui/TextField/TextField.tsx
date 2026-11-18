import {useId, type ComponentProps, type ReactNode} from 'react';
import {cx} from '../internal/cx';
import {describedBy, FieldShell, fieldBase, fieldBorder} from '../internal/FieldShell';

export interface TextFieldProps extends Omit<ComponentProps<'input'>, 'size'> {
  /** Visible label (required). Include "(opcional)" / "(obligatorio)" in the text if needed. */
  label: ReactNode;
  helper?: ReactNode;
  /** Error message; sets `aria-invalid` and links it via `aria-describedby`. */
  error?: ReactNode;
  leadingIcon?: ReactNode;
  size?: 'md' | 'lg';
  /** Control shown right-aligned on the label row (e.g. a "forgot password" link). */
  labelAction?: ReactNode;
}

export function TextField({
  label,
  helper,
  error,
  leadingIcon,
  size = 'md',
  labelAction,
  id: idProp,
  className,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const invalid = Boolean(error);

  return (
    <FieldShell id={id} label={label} helper={helper} error={error} labelAction={labelAction}>
      <div className="relative">
        {leadingIcon ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted [&>svg]:size-5"
          >
            {leadingIcon}
          </span>
        ) : null}
        <input
          {...rest}
          id={id}
          data-mia-ui
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy(id, Boolean(helper), invalid, rest['aria-describedby'])}
          className={cx(
            fieldBase,
            fieldBorder(invalid),
            size === 'lg' ? 'h-control-lg' : 'h-control-md',
            leadingIcon ? 'pl-10' : null,
            className,
          )}
        />
      </div>
    </FieldShell>
  );
}
