import {createContext, forwardRef, useContext, useId, type ComponentProps, type ReactNode} from 'react';
import {cx} from '../internal/cx';

interface RadioGroupContext {
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const Ctx = createContext<RadioGroupContext | null>(null);

export interface RadioGroupProps {
  /** Visible legend (use `legendHidden` to keep it screen-reader only). */
  legend: ReactNode;
  legendHidden?: boolean;
  value: string;
  onChange: (value: string) => void;
  /** Shared `name`; auto-generated when omitted. */
  name?: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

/** `fieldset` + `legend` wrapping native radios; arrow-key behavior is native. */
export function RadioGroup({legend, legendHidden, value, onChange, name, disabled, children, className}: RadioGroupProps) {
  const autoName = useId();
  return (
    <Ctx.Provider value={{name: name ?? autoName, value, onChange, disabled}}>
      <fieldset data-mia-ui disabled={disabled} className="min-w-0">
        <legend className={cx('text-label text-strong', legendHidden ? 'sr-only' : 'mb-2')}>{legend}</legend>
        <div className={cx('flex flex-col gap-1', className)}>{children}</div>
      </fieldset>
    </Ctx.Provider>
  );
}

export interface RadioProps extends Omit<ComponentProps<'input'>, 'type' | 'name' | 'value' | 'checked' | 'onChange' | 'children'> {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  /** Optional leading visual (e.g. an Icon) shown between the radio and the label. */
  leading?: ReactNode;
}

/** Native radio visually styled: ink ring, ink-blue dot. Must live in a `RadioGroup`. */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {value, label, description, leading, disabled, id: idProp, className, ...rest},
  ref,
) {
  const group = useContext(Ctx);
  if (!group) throw new Error('Radio must be used inside RadioGroup');
  const autoId = useId();
  const id = idProp ?? autoId;
  const descId = `${id}-desc`;
  const isDisabled = disabled || group.disabled;

  return (
    <label
      htmlFor={id}
      className={cx(
        'flex min-h-11 items-start gap-3 rounded-control px-3 py-2',
        isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-subtle',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-2px] has-[:focus-visible]:outline-focus',
        className,
      )}
    >
      <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <input
          {...rest}
          ref={ref}
          id={id}
          type="radio"
          name={group.name}
          value={value}
          checked={group.value === value}
          disabled={isDisabled}
          aria-describedby={description ? descId : undefined}
          onChange={() => group.onChange(value)}
          className="peer absolute inset-0 m-0 size-full cursor-[inherit] appearance-none rounded-full border-[1.5px] border-ink bg-surface outline-none transition-colors duration-[120ms] checked:border-ink"
        />
        <span
          aria-hidden
          className="pointer-events-none size-2.5 scale-0 rounded-full bg-primary transition-transform duration-[120ms] peer-checked:scale-100 motion-reduce:transition-none"
        />
      </span>
      {leading ? <span aria-hidden className="shrink-0 text-ink">{leading}</span> : null}
      <span className="flex min-w-0 flex-col">
        <span className="text-body text-strong">{label}</span>
        {description ? (
          <span id={descId} className="text-small text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
});
