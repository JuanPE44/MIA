import type {ReactNode} from 'react';
import {cx} from '../internal/cx';
import {Icon} from '../Icon';

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
  info: {box: 'bg-primary-tint border-primary-tint-border/30', icon: 'text-primary-text', icon_: 'info'},
  success: {box: 'bg-success-tint border-success/30', icon: 'text-success', icon_: 'success'},
  warning: {box: 'bg-warning-tint border-warning/30', icon: 'text-warning', icon_: 'warning'},
  danger: {box: 'bg-danger-tint border-danger/30', icon: 'text-danger', icon_: 'error'},
  simulated: {box: 'bg-simulated-tint border-simulated/30', icon: 'text-simulated', icon_: 'experiment'},
} as const;

export function InlineAlert({variant = 'info', title, children, actions, live, className}: InlineAlertProps) {
  const {box, icon, icon_: iconName} = styles[variant];
  const role = live ? (variant === 'danger' ? 'alert' : 'status') : undefined;
  return (
    <div role={role} className={cx('flex items-start gap-3 rounded-control border border-l-4 p-3 sm:p-4', box, className)}>
      <Icon name={iconName} weight="fill" className={cx('mt-0.5 size-5 shrink-0', icon)} />
      <div className="min-w-0 flex-1">
        {title ? <p className="text-body-strong text-strong">{title}</p> : null}
        {children ? <div className="text-small text-default">{children}</div> : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
