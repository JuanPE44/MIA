import {forwardRef, type ComponentProps, type ReactNode} from 'react';
import {cx} from '../internal/cx';
import {Icon, type IconName} from '../Icon';

export interface SelectableCardProps
  extends Omit<ComponentProps<'input'>, 'type' | 'title' | 'checked' | 'onChange' | 'children'> {
  title: ReactNode;
  description?: ReactNode;
  icon?: IconName;
  /** Replaces the icon (e.g. a Spinner while loading). */
  iconSlot?: ReactNode;
  selected?: boolean;
  /** Called when the card is chosen (radio `change`). */
  onSelect?: () => void;
}

/**
 * Card-styled choice with radio semantics: a visually hidden native radio inside
 * a label. Group several with the same `name`. Selected = ink border, offset
 * shadow and a highlighter mark on the title.
 */
export const SelectableCard = forwardRef<HTMLInputElement, SelectableCardProps>(function SelectableCard(
  {title, description, icon, iconSlot, selected = false, onSelect, disabled, className, ...rest},
  ref,
) {
  return (
    <label
      data-mia-ui
      className={cx(
        'relative flex flex-col items-start gap-3 rounded-card border p-5 text-left transition-[box-shadow,border-color,translate] duration-[120ms]',
        selected ? 'border-ink bg-primary-tint shadow-offset' : 'border-rule bg-surface',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:-translate-x-px hover:-translate-y-px hover:border-ink hover:shadow-offset',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
        className,
      )}
    >
      <input
        {...rest}
        ref={ref}
        type="radio"
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect?.()}
        className="sr-only"
      />
      {icon || iconSlot ? (
        <span aria-hidden className="flex size-10 items-center justify-center rounded-control bg-tile-azul">
          {iconSlot ?? <Icon name={icon as IconName} weight="duotone" className="size-6 text-ink" />}
        </span>
      ) : null}
      <span className="flex items-start gap-2">
        <span
          className={cx(
            'font-display text-h3 text-strong',
            selected && 'rounded-small bg-highlight px-1 text-highlight-ink',
          )}
        >
          {title}
        </span>
      </span>
      {description ? <span className="text-small text-muted">{description}</span> : null}
    </label>
  );
});
