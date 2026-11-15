import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from 'react';
import {createPortal} from 'react-dom';
import {cx} from '../internal/cx';
import {lockBodyScroll} from '../internal/scrollLock';
import {useIsPhone} from '../internal/useIsPhone';
import {IconButton} from '../IconButton';
import '../ui.css';
import {Icon} from '../Icon';

export interface DialogProps {
  open: boolean;
  /** Called on Escape, close button or backdrop click. The parent owns `open`. */
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Sticky footer, right-aligned buttons (secondary then primary). */
  footer?: ReactNode;
  children?: ReactNode;
  /** `alertdialog` for destructive confirmations. */
  role?: 'dialog' | 'alertdialog';
  /** Element to focus when opened (default: first focusable element). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Hide the header close button (alertdialog uses Cancelar instead). */
  hideCloseButton?: boolean;
  /** Disable Escape / backdrop dismissal (e.g. while saving). */
  dismissible?: boolean;
}

const widths = {sm: 'sm:max-w-dialog-sm', md: 'sm:max-w-dialog-md', lg: 'sm:max-w-dialog-lg'} as const;

/**
 * Modal dialog built on the native <dialog> + showModal(): the browser provides
 * the focus trap, inert background, Escape handling and top-layer stacking.
 * Below 640px it renders as a bottom sheet. Mounted only while `open`.
 */
export function Dialog(props: DialogProps) {
  if (!props.open || typeof document === 'undefined') return null;
  return createPortal(<DialogInner {...props} />, document.body);
}

function DialogInner({
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
  role = 'dialog',
  initialFocusRef,
  hideCloseButton,
  dismissible = true,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  const phone = useIsPhone();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const trigger = document.activeElement as HTMLElement | null;
    const unlock = lockBodyScroll();
    if (!dialog.open) dialog.showModal();
    initialFocusRef?.current?.focus();
    return () => {
      unlock();
      if (dialog.open) dialog.close();
      // Focus returns to the element that opened the dialog.
      if (trigger && trigger.isConnected) trigger.focus();
    };
    // Mount/unmount only: focus target is read once at open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = (e: SyntheticEvent) => {
    // Escape: keep the dialog controlled by the parent.
    e.preventDefault();
    if (dismissible) onClose();
  };

  return (
    <dialog
      ref={ref}
      role={role}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={handleCancel}
      onClick={(e) => {
        // Click on the backdrop area (the <dialog> itself) dismisses.
        if (dismissible && e.target === ref.current) onClose();
      }}
      className={cx(
        'mia-dialog flex w-full max-w-none flex-col overflow-hidden border border-ink bg-surface-raised p-0',
        'text-strong shadow-offset backdrop:bg-[rgb(20_19_15/55%)]',
        phone
          ? 'mia-anim-sheet mx-0 mb-0 mt-auto max-h-[92vh] rounded-t-card'
          : cx(
              'mia-anim-dialog m-auto max-h-[calc(100vh-4rem)] rounded-card',
              widths[size],
            ),
      )}
    >
      {phone ? (
        <div aria-hidden className="mx-auto mt-2 h-1 w-8 shrink-0 rounded-pill bg-hairline" />
      ) : null}
      <header className="flex items-start justify-between gap-4 px-6 pt-5">
        <h2 id={titleId} className="text-h2 text-strong">
          {title}
        </h2>
        {hideCloseButton ? null : (
          <IconButton
            aria-label="Cerrar"
            icon={<Icon name="close" className="size-5" />}
            size="sm"
            className="-mr-2"
            onClick={() => dismissible && onClose()}
          />
        )}
      </header>
      {description ? (
        <p id={descId} className="px-6 pt-1 text-body text-muted">
          {description}
        </p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
      {footer ? (
        <footer
          className={cx(
            'flex gap-3 border-t border-hairline px-6 py-4',
            phone ? 'flex-col-reverse [&>*]:w-full' : 'justify-end',
          )}
        >
          {footer}
        </footer>
      ) : null}
    </dialog>
  );
}
