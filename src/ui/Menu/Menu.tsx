import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {createPortal} from 'react-dom';
import {cx} from '../internal/cx';
import {useIsPhone} from '../internal/useIsPhone';
import {IconButton} from '../IconButton';
import '../ui.css';
import {Icon} from '../Icon';

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Destructive item; rendered last, after a divider. */
  danger?: boolean;
  disabled?: boolean;
  /** Renders a divider above this item (to group items; danger items get one automatically). */
  dividerBefore?: boolean;
}

/** Props to spread on a custom trigger element. */
export interface MenuTriggerProps {
  ref: (node: HTMLElement | null) => void;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls': string | undefined;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

export interface MenuProps {
  items: MenuItem[];
  /** Accessible name of the default trigger and of the menu. */
  label?: string;
  /** Custom trigger; spread the received props onto a button-like element. */
  renderTrigger?: (props: MenuTriggerProps) => ReactNode;
  /**
   * Opens the same menu on right-click of this element (desktop). The menu is
   * positioned at the pointer. Keep a visible trigger as the primary entry.
   */
  contextTargetRef?: RefObject<HTMLElement | null>;
  className?: string;
  /** Optional non-interactive header at the top of the panel (e.g. account name). */
  header?: ReactNode;
}

type Anchor = {kind: 'trigger'} | {kind: 'point'; x: number; y: number};

export function Menu({items, label = 'Más opciones', renderTrigger, contextTargetRef, className, header}: MenuProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [focusLast, setFocusLast] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuId = useId();
  const open = anchor !== null;

  const close = useCallback((restoreFocus: boolean) => {
    setAnchor(null);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const target = contextTargetRef?.current;
    if (!target) return;
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      setFocusLast(false);
      setAnchor({kind: 'point', x: e.clientX, y: e.clientY});
    };
    target.addEventListener('contextmenu', onContext);
    return () => target.removeEventListener('contextmenu', onContext);
  }, [contextTargetRef]);

  const triggerProps: MenuTriggerProps = {
    ref: (node) => {
      triggerRef.current = node;
    },
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    onClick: () => {
      setFocusLast(false);
      setAnchor(open ? null : {kind: 'trigger'});
    },
    onKeyDown: (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusLast(e.key === 'ArrowUp');
        setAnchor({kind: 'trigger'});
      }
      // Enter / Space already fire onClick on a native button.
    },
  };

  const trigger = renderTrigger ? (
    renderTrigger(triggerProps)
  ) : (
    <IconButton
      {...triggerProps}
      ref={triggerProps.ref}
      aria-label={label}
      icon={<Icon name="more" className="size-5" />}
      className={className}
    />
  );

  return (
    <>
      {trigger}
      {open ? (
        <MenuPanel
          id={menuId}
          label={label}
          items={items}
          header={header}
          anchor={anchor}
          triggerRef={triggerRef}
          focusLast={focusLast}
          onClose={close}
        />
      ) : null}
    </>
  );
}

interface PanelProps {
  id: string;
  label: string;
  items: MenuItem[];
  header?: ReactNode;
  anchor: Anchor;
  triggerRef: RefObject<HTMLElement | null>;
  focusLast: boolean;
  onClose: (restoreFocus: boolean) => void;
}

function MenuPanel({id, label, items, header, anchor, triggerRef, focusLast, onClose}: PanelProps) {
  const phone = useIsPhone();
  const panelRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({text: '', timer: 0});
  const [pos, setPos] = useState<{top: number; left: number} | null>(null);

  // Normal items first, danger items last (spec 1.4).
  const ordered = [...items.filter((i) => !i.danger), ...items.filter((i) => i.danger)];
  const firstDanger = ordered.findIndex((i) => i.danger);

  const buttons = () =>
    Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);

  // Position near the trigger / pointer, flipped to stay inside the viewport.
  useLayoutEffect(() => {
    if (phone) return;
    const panel = panelRef.current;
    if (!panel) return;
    const {width, height} = panel.getBoundingClientRect();
    let x: number;
    let y: number;
    if (anchor.kind === 'point') {
      x = anchor.x;
      y = anchor.y;
    } else {
      const r = triggerRef.current?.getBoundingClientRect();
      x = r ? r.right - width : 0;
      y = r ? r.bottom + 4 : 0;
      if (r && y + height > window.innerHeight - 8) y = r.top - height - 4;
    }
    x = Math.max(8, Math.min(x, window.innerWidth - width - 8));
    y = Math.max(8, Math.min(y, window.innerHeight - height - 8));
    setPos({top: y, left: x});
  }, [anchor, phone, triggerRef]);

  useEffect(() => {
    const list = buttons();
    (focusLast ? list[list.length - 1] : list[0])?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Outside pointer press closes (focus stays where the user clicked).
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      onClose(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [onClose, triggerRef]);

  useEffect(() => () => window.clearTimeout(typeahead.current.timer), []);

  const onKeyDown = (e: KeyboardEvent) => {
    const list = buttons();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (n: number) => list[(n + list.length) % list.length]?.focus();
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusAt(i + 1);
        return;
      case 'ArrowUp':
        e.preventDefault();
        focusAt(i - 1);
        return;
      case 'Home':
        e.preventDefault();
        list[0]?.focus();
        return;
      case 'End':
        e.preventDefault();
        list[list.length - 1]?.focus();
        return;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        onClose(true);
        return;
      case 'Tab':
        onClose(true);
        return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
      const ta = typeahead.current;
      window.clearTimeout(ta.timer);
      ta.text += e.key.toLowerCase();
      ta.timer = window.setTimeout(() => (ta.text = ''), 500);
      const start = ta.text.length > 1 ? i : i + 1;
      for (let k = 0; k < list.length; k++) {
        const b = list[(start + k) % list.length];
        if (b.textContent?.trim().toLowerCase().startsWith(ta.text)) {
          b.focus();
          break;
        }
      }
    }
  };

  const panel = (
    <div
      ref={panelRef}
      id={id}
      role="menu"
      aria-label={label}
      onKeyDown={onKeyDown}
      style={phone ? undefined : {top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden'}}
      className={cx(
        'fixed z-50 flex flex-col border border-hairline bg-surface-raised p-1 text-strong shadow-elevation-2',
        phone
          ? 'mia-anim-sheet inset-x-0 bottom-0 rounded-t-card px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]'
          : 'mia-anim-pop min-w-[200px] rounded-control',
      )}
    >
      {phone ? <div aria-hidden className="mx-auto mb-2 mt-1 h-1 w-8 shrink-0 rounded-pill bg-hairline" /> : null}
      {header ? (
        <div role="none" className="border-b border-hairline px-3 pb-2 pt-1">
          {header}
        </div>
      ) : null}
      {ordered.map((item, idx) => (
        <div key={item.id} role="none">
          {(idx === firstDanger && idx > 0) || (item.dividerBefore && idx > 0) ? <div role="separator" className="my-1 h-px bg-hairline" /> : null}
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            aria-disabled={item.disabled || undefined}
            onClick={() => {
              if (item.disabled) return;
              onClose(true);
              item.onSelect();
            }}
            className={cx(
              'flex h-10 w-full items-center gap-3 rounded-small px-3 text-left text-label pointer-coarse:h-11',
              'transition-colors duration-[120ms] focus-visible:bg-subtle focus-visible:outline-none',
              item.danger ? 'text-danger hover:bg-danger-tint focus-visible:bg-danger-tint' : 'hover:bg-subtle',
              item.disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            {item.icon ? (
              <span aria-hidden className="shrink-0 [&>svg]:size-5">
                {item.icon}
              </span>
            ) : null}
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );

  return createPortal(
    phone ? (
      <>
        <div aria-hidden className="mia-anim-fade fixed inset-0 z-40 bg-[rgb(18_22_28/48%)]" />
        {panel}
      </>
    ) : (
      panel
    ),
    document.body,
  );
}
