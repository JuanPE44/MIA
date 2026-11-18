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
  /** Full-bleed visual above the title (e.g. a color band); the card then drops its padding. */
  media?: ReactNode;
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
  media,
  className,
}: InteractiveCardProps) {
  const Heading = `h${headingLevel}` as 'h3';
  const stretched = cx(
    'text-left text-h3 text-strong outline-none',
    "after:absolute after:inset-0 after:rounded-card after:content-['']",
    'focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus',
  );
  const body = (
    <>
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
      {children ? <div className={media ? 'mt-1' : 'mt-2'}>{children}</div> : null}
    </>
  );
  return (
    <Card
      selected={selected}
      flush={Boolean(media)}
      className={cx(
        'group relative transition-[box-shadow,border-color,translate] duration-[120ms]',
        // No overflow-hidden: it would clip the stretched link's focus ring; media rounds its own top corners.
        media ? 'flex flex-col' : undefined,
        'hover:-translate-x-px hover:-translate-y-px hover:border-ink hover:shadow-offset',
        className,
      )}
    >
      {media}
      {media ? <div className="p-4 sm:p-5">{body}</div> : body}
      {actions ? <div className="absolute right-2 top-2 z-10">{actions}</div> : null}
    </Card>
  );
}
