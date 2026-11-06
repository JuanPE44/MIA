import {useCallback, useEffect, useRef, useState, type ReactNode} from 'react';
import {Link} from 'react-router';
import {cx} from '../internal/cx';

export interface NavTabItem {
  id: string;
  label: string;
  to: string;
  icon?: ReactNode;
  /** Optional count badge. */
  count?: number;
}

export interface TabsProps {
  items: NavTabItem[];
  activeId: string;
  /** Accessible name of the `nav`. */
  'aria-label': string;
  className?: string;
}

/**
 * Navigation tabs (URL sections): `nav` + links with `aria-current`, not a
 * tablist. Active = underline + weight + color. Overflows with horizontal
 * scroll and a fade on the clipped edge(s).
 */
export function Tabs({items, activeId, 'aria-label': ariaLabel, className}: TabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({left: false, right: false});

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setFade({left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1});
  }, []);

  useEffect(() => {
    update();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, items.length]);

  // Keep the active tab visible when it is clipped.
  useEffect(() => {
    scrollRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView?.({block: 'nearest', inline: 'nearest'});
  }, [activeId]);

  const l = fade.left ? 'transparent, black 24px' : 'black, black 24px';
  const r = fade.right ? 'black calc(100% - 24px), transparent' : 'black calc(100% - 24px), black';
  const mask = `linear-gradient(to right, ${l}, ${r})`;

  return (
    <nav aria-label={ariaLabel} className={cx('border-b border-hairline', className)}>
      <div
        ref={scrollRef}
        onScroll={update}
        style={{maskImage: mask, WebkitMaskImage: mask}}
        className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <Link
              key={item.id}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'relative inline-flex h-12 shrink-0 items-center gap-2 px-4 text-label transition-colors duration-[120ms]',
                active ? 'font-semibold text-primary-text' : 'font-medium text-muted hover:text-strong',
              )}
            >
              {item.icon ? (
                <span aria-hidden className="[&>svg]:size-5">
                  {item.icon}
                </span>
              ) : null}
              {item.label}
              {item.count !== undefined ? (
                <span className="rounded-pill bg-subtle px-2 text-caption text-muted">{item.count}</span>
              ) : null}
              {active ? <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
