import {useEffect, useRef, useState, type ReactNode} from 'react';
import {Link} from 'react-router';
import {cx} from '../internal/cx';
import {withWeight} from '../Tabs/Tabs';

export interface BottomTabItem {
  id: string;
  label: string;
  to: string;
  icon: ReactNode;
}

export interface BottomTabBarProps {
  items: BottomTabItem[];
  activeId: string;
  'aria-label': string;
}

function isTextEntry(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable) return true;
  // A button inside a form that has a text field (e.g. the chat "send" button): keep the bar hidden,
  // otherwise it reappears on pointerdown, shifts the form and the tap never becomes a click.
  return tag === 'BUTTON' && Boolean(el.closest('form')?.querySelector('textarea, input:not([type=hidden]):not([type=checkbox]):not([type=radio])'));
}

/**
 * Phone bottom navigation (render below 640 px only). Publishes its height in
 * `--mia-bottom-bar` on `<html>` so Toast and page padding clear it; hides
 * itself (and resets the variable) while a text field is focused (on-screen
 * keyboard).
 */
export function BottomTabBar({items, activeId, 'aria-label': ariaLabel}: BottomTabBarProps) {
  const ref = useRef<HTMLElement>(null);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const sync = () => setTyping(isTextEntry(document.activeElement));
    sync();
    document.addEventListener('focusin', sync);
    document.addEventListener('focusout', sync);
    return () => {
      document.removeEventListener('focusin', sync);
      document.removeEventListener('focusout', sync);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (typing || !el) {
      root.style.setProperty('--mia-bottom-bar', '0px');
      return;
    }
    const set = () => root.style.setProperty('--mia-bottom-bar', `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty('--mia-bottom-bar');
    };
  }, [typing]);

  return (
    <nav
      ref={ref}
      aria-label={ariaLabel}
      hidden={typing}
      className={cx(
        'fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden',
      )}
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-caption font-semibold',
                  'focus-visible:outline-offset-[-2px]',
                  active ? 'text-strong' : 'text-muted',
                )}
              >
                {active ? (
                  <span aria-hidden className="absolute inset-x-0 top-0 mx-auto h-1 w-8 rounded-pill border-b-2 border-ink bg-highlight" />
                ) : null}
                <span aria-hidden className="[&>svg]:size-6">
                  {withWeight(item.icon, active)}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
