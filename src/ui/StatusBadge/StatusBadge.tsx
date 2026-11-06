import type {ReactNode} from 'react';
import {AlertCircle, AlertTriangle, CheckCircle2, Circle} from 'lucide-react';
import {cx} from '../internal/cx';
import {Spinner} from '../Spinner';

export type StatusVariant = 'neutral' | 'info' | 'success' | 'danger' | 'warning';

export interface StatusBadgeProps {
  variant?: StatusVariant;
  children: ReactNode;
  /** Replaces the icon with a spinner (e.g. "Analizando…"). Typically with `info`. */
  loading?: boolean;
  className?: string;
}

const styles = {
  neutral: ['bg-subtle text-default', Circle],
  info: ['bg-primary-tint text-primary-on-tint', Circle],
  success: ['bg-success-tint text-success', CheckCircle2],
  danger: ['bg-danger-tint text-danger', AlertCircle],
  warning: ['bg-warning-tint text-warning', AlertTriangle],
} as const;

export function StatusBadge({variant = 'neutral', children, loading, className}: StatusBadgeProps) {
  const [tone, Icon] = styles[variant];
  return (
    <span className={cx('inline-flex h-6 items-center gap-1 rounded-pill px-2 text-caption', tone, className)}>
      {loading ? <Spinner size={16} className="size-3.5 text-current" /> : <Icon aria-hidden className="size-3.5" />}
      {children}
    </span>
  );
}
