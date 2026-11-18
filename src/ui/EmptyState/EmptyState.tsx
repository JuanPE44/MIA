import {cloneElement, isValidElement, type ReactElement, type ReactNode} from 'react';
import {cx} from '../internal/cx';
import {HighlightStroke, InkUnderline} from '../InkMark';

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

/**
 * Empty state in the "ink + highlighter" language: a marker smear behind the
 * icon and a hand-drawn ink underline below the title.
 */
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
      <div aria-hidden className="relative isolate flex size-24 items-center justify-center">
        <HighlightStroke className="absolute -bottom-1 -left-6 -z-10 h-12 w-36 -rotate-3 opacity-90" />
        <div className="flex size-24 items-center justify-center rounded-pill border border-ink bg-surface text-primary-on-tint shadow-offset [&>svg]:size-12">
          {glyph}
        </div>
      </div>
      <Heading className="mt-6 font-display text-h2 text-strong">
        <span className="relative inline-block">
          {title}
          <InkUnderline className="absolute -bottom-2 left-0 text-ink opacity-70" delay={0.35} />
        </span>
      </Heading>
      {description ? <p className="mt-4 text-body text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
      {secondaryAction ? <div className="mt-3">{secondaryAction}</div> : null}
    </div>
  );
}
