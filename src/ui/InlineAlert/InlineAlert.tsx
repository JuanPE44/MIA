import type {ReactNode} from 'react';
import {AlertCircle, AlertTriangle, CheckCircle2, FlaskConical, Info} from 'lucide-react';
import {cx} from '../internal/cx';

export type InlineAlertVariant = 'info' | 'success' | 'warning' | 'danger' | 'simulated';

export interface InlineAlertProps {
  variant?: InlineAlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  /** Ghost buttons, e.g. "Reintentar". */
  actions?: ReactNode;
  /**
   * Set when the alert appears as the result of an action: danger gets
   * `role="alert"`, others `role="status"`. Static alerts have no role.
   */
  live?: boolean;
  className?: string;
}

const styles = {
  info: {box: 'bg-primary-tint border-primary-tint-border/30', icon: 'text-primary-text', Icon: Info},
  success: {box: 'bg-success-tint border-success/30', icon: 'text-success', Icon: CheckCircle2},
  warning: {box: 'bg-warning-tint border-warning/30', icon: 'text-warning', Icon: AlertTriangle},
  danger: {box: 'bg-danger-tint border-danger/30', icon: 'text-danger', Icon: AlertCircle},
  simulated: {box: 'bg-simulated-tint border-simulated/30', icon: 'text-simulated', Icon: FlaskConical},
} as const;

export function InlineAlert({variant = 'info', title, children, actions, live, className}: InlineAlertProps) {
  const {box, icon, Icon} = styles[variant];
  const role = live ? (variant === 'danger' ? 'alert' : 'status') : undefined;
  return (
    <div role={role} className={cx('flex items-start gap-3 rounded-control border p-3 sm:p-4', box, className)}>
      <Icon aria-hidden className={cx('mt-0.5 size-5 shrink-0', icon)} />
      <div className="min-w-0 flex-1">
        {title ? <p className="text-body-strong text-strong">{title}</p> : null}
        {children ? <div className="text-small text-default">{children}</div> : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
