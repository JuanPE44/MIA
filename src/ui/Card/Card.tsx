import type {ComponentProps, ElementType, MouseEvent, ReactNode} from 'react';
import {cx} from '../internal/cx';

export interface CardProps extends ComponentProps<'div'> {
  as?: ElementType;
  selected?: boolean;
  /** Remove the default padding (16 phone / 20 tablet+). */
  flush?: boolean;
}

export function Card({as: Tag = 'div', selected, flush, className, ...rest}: CardProps) {
  return (
    <Tag
      {...rest}
      className={cx(
        'rounded-card border',
        selected ? 'border-ink bg-primary-tint' : 'border-rule bg-surface',
        !flush && 'p-4 sm:p-5',
        className,
      )}
    />
  );
}

export interface InteractiveCardProps {
  /** Card title: rendered inside the link/button and used as its accessible name. */
  title: ReactNode;
  headingLevel?: 2 | 3 | 4;
  /** Renders the title as an <a>; otherwise a <button> using `onClick`. */
  href?: string;
  /** Receives the click event so SPA links can `preventDefault()` and navigate client-side. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  selected?: boolean;
  /** Visual content under the title (not part of the link's accessible name). */
  children?: ReactNode;
  /**
   * Secondary actions (e.g. a Menu button). Placed above the stretched link so
   * they keep their own focus stop and are never nested inside the link.
   */
  actions?: ReactNode;
  className?: string;
}

/**
 * Whole card is one link/button via the "stretched link" pattern: the title
 * element's ::after covers the card; `actions` sit above it (z-10).
 */
export function InteractiveCard({
  title,
  headingLevel = 3,
  href,
  onClick,
  selected,
  children,
  actions,
  className,
}: InteractiveCardProps) {
  const Heading = `h${headingLevel}` as 'h3';
  const stretched = cx(
    'text-left text-h3 text-strong outline-none',
    "after:absolute after:inset-0 after:rounded-card after:content-['']",
    'focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus',
  );
  return (
    <Card
      selected={selected}
      className={cx(
        'group relative transition-[box-shadow,border-color,translate] duration-[120ms]',
        'hover:-translate-x-px hover:-translate-y-px hover:border-ink hover:shadow-offset',
        className,
      )}
    >
      <Heading>
        {href ? (
          <a href={href} className={stretched} onClick={onClick}>
            {title}
          </a>
        ) : (
          <button type="button" className={stretched} onClick={onClick}>
            {title}
          </button>
        )}
      </Heading>
      {children ? <div className="mt-2">{children}</div> : null}
      {actions ? <div className="absolute right-2 top-2 z-10">{actions}</div> : null}
    </Card>
  );
}
