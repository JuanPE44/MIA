import {forwardRef, useId, type ComponentProps, type ReactNode} from 'react';
import {cx} from '../internal/cx';
import {describedBy, FieldShell, fieldBase, fieldBorder} from '../internal/FieldShell';
import {Icon} from '../Icon';

export interface SelectProps extends Omit<ComponentProps<'select'>, 'size'> {
  /** Visible label (required). */
  label: ReactNode;
  helper?: ReactNode;
  /** Error message; sets `aria-invalid` and links it via `aria-describedby`. */
  error?: ReactNode;
  size?: 'md' | 'lg';
}

/** Labelled native select styled like TextField, with a custom chevron. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {label, helper, error, size = 'md', id: idProp, className, children, ...rest},
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const invalid = Boolean(error);

  return (
    <FieldShell id={id} label={label} helper={helper} error={error}>
      <div className="relative">
        <select
          {...rest}
          ref={ref}
          id={id}
          data-mia-ui
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy(id, Boolean(helper), invalid, rest['aria-describedby'])}
          className={cx(
            fieldBase,
            fieldBorder(invalid),
            'appearance-none bg-surface pr-10 text-strong [&>option]:bg-surface [&>option]:text-strong',
            size === 'lg' ? 'h-control-lg' : 'h-control-md',
            className,
          )}
        >
          {children}
        </select>
        <Icon
          name="chevron-down"
          className="pointer-events-none absolute inset-y-0 right-3 my-auto size-5 text-muted"
        />
      </div>
    </FieldShell>
  );
});
