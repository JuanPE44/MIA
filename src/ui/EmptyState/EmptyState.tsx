import {cloneElement, isValidElement, type ReactElement, type ReactNode} from 'react';
import {cx} from '../internal/cx';

export interface EmptyStateProps {
  /** `<Icon name=… />` element; forced to duotone, 48px, inside a 96px paper tint. */
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** The single primary action. */
  action?: ReactNode;
  /** Optional secondary link/button. */
  secondaryAction?: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  headingLevel = 2,
  className,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as 'h2';
  const glyph = isValidElement(icon) ? cloneElement(icon as ReactElement<{weight?: string}>, {weight: 'duotone'}) : icon;
  return (
    <div className={cx('mx-auto flex max-w-[400px] flex-col items-center px-4 py-10 text-center', className)}>
      <div
        aria-hidden
        className="flex size-24 items-center justify-center rounded-pill border border-rule bg-primary-tint text-primary-on-tint [&>svg]:size-12"
      >
        {glyph}
      </div>
      <Heading className="mt-6 font-display text-h2 text-strong">{title}</Heading>
      {description ? <p className="mt-2 text-body text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
      {secondaryAction ? <div className="mt-3">{secondaryAction}</div> : null}
    </div>
  );
}
