import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {cx} from '../internal/cx';
import {Button} from '../Button';
import {IconButton} from '../IconButton';
import '../ui.css';
import {Icon} from '../Icon';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastOptions {
  message: ReactNode;
  variant?: ToastVariant;
  /** Optional single action, e.g. "Deshacer". The toast closes after it runs. */
  action?: {label: string; onAction: () => void};
  /** Override auto-dismiss (ms). Defaults: 5000, or 8000 with an action. */
  duration?: number;
}

export interface ToastApi {
  /** Shows a toast, replacing any current one (one at a time). Returns its id. */
  show: (options: ToastOptions) => number;
  dismiss: (id?: number) => void;
}

interface ActiveToast extends ToastOptions {
  id: number;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const icons = {info: 'info', success: 'success', warning: 'warning', danger: 'error'} as const;
/** Sticky-note look: highlighter yellow for info/success, tinted paper for warning/danger. */
const note = {
  info: 'border-ink bg-highlight text-highlight-ink',
  success: 'border-ink bg-highlight text-highlight-ink',
  warning: 'border-warning bg-warning-tint text-strong',
  danger: 'border-danger bg-danger-tint text-strong',
} as const;

export function ToastProvider({children}: {children: ReactNode}) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id?: number) => {
    setToast((cur) => (id === undefined || cur?.id === id ? null : cur));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setToast({...options, id});
    return id;
  }, []);

  const api = useMemo(() => ({show, dismiss}), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/*
        Always-mounted polite live region so screen readers announce new toasts.
        Phone: bottom-center, offset by --mia-bottom-bar (set it to the
        BottomTabBar height); desktop: bottom-left.
      */}
      <div
        role="status"
        aria-live="polite"
        className={cx(
          'pointer-events-none fixed z-[60] flex justify-center px-4',
          'inset-x-0 bottom-[calc(1rem+var(--mia-bottom-bar,0px)+env(safe-area-inset-bottom))]',
          'sm:inset-x-auto sm:bottom-6 sm:left-6 sm:justify-start sm:px-0',
        )}
      >
        {toast ? <ToastView key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} /> : null}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({toast, onDismiss}: {toast: ActiveToast; onDismiss: () => void}) {
  const variant = toast.variant ?? 'info';
  const iconName = icons[variant];
  const reduced = useReducedMotion();
  const total = toast.duration ?? (toast.action ? 8000 : 5000);
  const remaining = useRef(total);
  const startedAt = useRef(0);
  const timer = useRef(0);
  const holds = useRef(0); // hover + focus holders

  const start = useCallback(() => {
    startedAt.current = Date.now();
    timer.current = window.setTimeout(onDismiss, remaining.current);
  }, [onDismiss]);

  const pause = useCallback(() => {
    if (holds.current++ === 0) {
      window.clearTimeout(timer.current);
      remaining.current -= Date.now() - startedAt.current;
    }
  }, []);

  const resume = useCallback(() => {
    if (--holds.current <= 0) {
      holds.current = 0;
      start();
    }
  }, [start]);

  useEffect(() => {
    start();
    return () => window.clearTimeout(timer.current);
  }, [start]);

  return (
    <motion.div
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      initial={reduced ? false : {opacity: 0, y: 14, rotate: -4, scale: 0.96}}
      animate={{opacity: 1, y: 0, rotate: reduced ? 0 : -1, scale: 1}}
      transition={{type: 'spring', stiffness: 380, damping: 26}}
      className={cx(
        'pointer-events-auto flex w-full max-w-[400px] items-center gap-3 rounded-small border-[1.5px]',
        'py-2.5 pl-4 pr-2 shadow-offset',
        note[variant],
      )}
    >
      <Icon name={iconName} weight="fill" className="size-5 shrink-0" />
      <p className="min-w-0 flex-1 text-small">{toast.message}</p>
      {toast.action ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            toast.action?.onAction();
            onDismiss();
          }}
        >
          {toast.action.label}
        </Button>
      ) : null}
      <IconButton
        aria-label="Cerrar aviso"
        icon={<Icon name="close" className="size-4" />}
        size="sm"
        tooltip={false}
        onClick={onDismiss}
        className="text-current hover:bg-black/10"
      />
    </motion.div>
  );
}
