import {Fragment} from 'react';
import {Link} from 'react-router';
import {cx} from '../internal/cx';
import {Icon} from '../Icon';

export interface BreadcrumbItem {
  label: string;
  /** Omit on the current (last) item. */
  to?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/** `nav aria-label="Ruta"`; the last item is the current page and is not a link. */
export function Breadcrumb({items, className}: BreadcrumbProps) {
  return (
    <nav aria-label="Ruta" className={cx('min-w-0', className)}>
      <ol className="flex min-w-0 items-center gap-1 text-small text-muted">
        {items.map((item, i) => {
          const current = i === items.length - 1;
          return (
            <Fragment key={`${i}-${item.label}`}>
              <li className={cx('flex min-w-0 items-center', current ? 'shrink' : 'shrink-0')}>
                {current || !item.to ? (
                  <span aria-current={current ? 'page' : undefined} className="truncate text-default">
                    {item.label}
                  </span>
                ) : (
                  <Link to={item.to} className="truncate rounded-small hover:text-strong hover:underline">
                    {item.label}
                  </Link>
                )}
              </li>
              {!current ? (
                <li aria-hidden className="flex shrink-0 items-center">
                  <Icon name="chevron-right" className="size-4" />
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
