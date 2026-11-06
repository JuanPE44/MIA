import {useId} from 'react';
import {cx} from '../internal/cx';

export interface IconPickerProps {
  /** Visible group label, e.g. "Ícono". */
  label: string;
  icons: readonly string[];
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

/**
 * Emoji picker as a radiogroup of 44px tiles (spec 2.10). Built on native
 * radios so arrow keys, Tab and screen-reader semantics come for free.
 */
export function IconPicker({label, icons, value, onChange, className}: IconPickerProps) {
  const name = useId();
  return (
    <fieldset className={className}>
      <legend className="mb-2 text-label text-strong">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {icons.map((icon) => {
          const selected = icon === value;
          return (
            <label
              key={icon}
              className={cx(
                'relative flex size-11 cursor-pointer items-center justify-center rounded-control border text-xl',
                'transition-colors duration-[120ms] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
                selected ? 'border-primary bg-primary-tint' : 'border-hairline bg-surface hover:border-control',
              )}
            >
              <input
                type="radio"
                name={name}
                value={icon}
                checked={selected}
                onChange={() => onChange(icon)}
                aria-label={`Ícono ${icon}`}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <span aria-hidden>{icon}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
