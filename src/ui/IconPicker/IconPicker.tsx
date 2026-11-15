import {useId} from 'react';
import {cx} from '../internal/cx';
import {Icon, ICON_LABELS, resolveItemIcon} from '../Icon';

export interface IconPickerProps {
  /** Visible group label, e.g. "Ícono". */
  label: string;
  /** Icon registry keys (see `ICONS`). Legacy emoji values still resolve. */
  icons: readonly string[];
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

/**
 * Icon picker (curated Phosphor set) as a radiogroup of 44px tiles (spec 2.10). Built on native
 * radios so arrow keys, Tab and screen-reader semantics come for free.
 */
export function IconPicker({label, icons, value, onChange, className}: IconPickerProps) {
  const group = useId();
  return (
    <fieldset className={className}>
      <legend className="mb-2 text-label text-strong">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {icons.map((icon) => {
          const selected = icon === resolveItemIcon(value, icons[0] as never);
          const name = resolveItemIcon(icon);
          return (
            <label
              key={icon}
              className={cx(
                'relative flex size-11 cursor-pointer items-center justify-center rounded-control border text-xl text-strong',
                'transition-colors duration-[120ms] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
                selected ? 'border-primary bg-primary-tint' : 'border-hairline bg-surface hover:border-control',
              )}
            >
              <input
                type="radio"
                name={group}
                value={icon}
                checked={selected}
                onChange={() => onChange(icon)}
                aria-label={`Ícono ${ICON_LABELS[name] ?? icon}`}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <Icon name={name} weight={selected ? 'fill' : 'duotone'} className="size-6" />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
