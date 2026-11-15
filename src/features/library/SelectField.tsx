import {useId, type ComponentProps, type ReactNode} from 'react';
import {cx} from '../../ui/internal/cx';
import {FieldShell, fieldBase, fieldBorder} from '../../ui/internal/FieldShell';
import {Icon} from '../../ui/Icon';

interface SelectFieldProps extends ComponentProps<'select'> {
  label: ReactNode;
  children: ReactNode;
}

/** Native select styled like TextField (no Select primitive in `ui/` yet). */
export function SelectField({label, children, id: idProp, className, ...rest}: SelectFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label}>
      <div className="relative">
        <select
          {...rest}
          id={id}
          data-mia-ui
          className={cx(fieldBase, fieldBorder(false), 'h-control-md appearance-none pr-10', className)}
        >
          {children}
        </select>
        <Icon name="chevron-down"
          className="pointer-events-none absolute inset-y-0 right-3 my-auto size-5 text-muted"
        />
      </div>
    </FieldShell>
  );
}
