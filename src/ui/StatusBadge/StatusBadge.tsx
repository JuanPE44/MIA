import type {ReactNode} from 'react';
import {cx} from '../internal/cx';
import {Icon, type IconName} from '../Icon';
import {Spinner} from '../Spinner';

export type StatusVariant = 'neutral' | 'info' | 'success' | 'danger' | 'warning';

export interface StatusBadgeProps {
  variant?: StatusVariant;
  children: ReactNode;
  /** Replaces the icon with a spinner (e.g. "Analizando…"). Typically with `info`. */
  loading?: boolean;
  className?: string;
}

const styles: Record<StatusVariant, [string, IconName]> = {
  neutral: ['bg-subtle text-default', 'circle'],
  info: ['bg-primary-tint text-primary-on-tint', 'circle'],
  success: ['bg-success-tint text-success', 'success'],
  danger: ['bg-danger-tint text-danger', 'error'],
  warning: ['bg-warning-tint text-warning', 'warning'],
};

export function StatusBadge({variant = 'neutral', children, loading, className}: StatusBadgeProps) {
  const [tone, iconName] = styles[variant];
  return (
    <span className={cx('inline-flex h-6 items-center gap-1 rounded-pill px-2 text-caption font-medium tracking-wide', tone, className)}>
      {loading ? <Spinner size={16} className="size-3.5 text-current" /> : <Icon name={iconName} weight="fill" className="size-3.5" />}
      {children}
    </span>
  );
}
