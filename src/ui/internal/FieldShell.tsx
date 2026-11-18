import type {ReactNode} from 'react';
import {Icon} from '../Icon';

interface FieldShellProps {
  id: string;
  label: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  counter?: ReactNode;
  /** Optional control (e.g. a link) shown right-aligned on the label row. */
  labelAction?: ReactNode;
  children: ReactNode;
}

export const helperId = (id: string) => `${id}-helper`;
export const errorId = (id: string) => `${id}-error`;

/** Builds the aria-describedby value for a field. */
export function describedBy(id: string, hasHelper: boolean, hasError: boolean, extra?: string) {
  const ids = [hasError && errorId(id), hasHelper && helperId(id), extra].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

/** Shared label / helper / error layout for TextField and Textarea. */
export function FieldShell({id, label, helper, error, counter, labelAction, children}: FieldShellProps) {
  return (
    <div data-mia-ui className="flex flex-col">
      {labelAction ? (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="text-label text-strong">
            {label}
          </label>
          {labelAction}
        </div>
      ) : (
        <label htmlFor={id} className="mb-2 text-label text-strong">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={errorId(id)} className="mt-1 flex items-start gap-1.5 text-small text-danger">
          <Icon name="error" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
      {helper ? (
        <p id={helperId(id)} className="mt-1 text-small text-muted">
          {helper}
        </p>
      ) : null}
      {counter ? <p className="mt-1 text-right text-caption text-muted">{counter}</p> : null}
    </div>
  );
}

export const fieldBase =
  'w-full rounded-control border bg-surface px-3 text-body text-strong placeholder:text-muted ' +
  'transition-colors duration-[120ms] disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted ' +
  'focus-visible:border-primary';

export const fieldBorder = (invalid: boolean) =>
  invalid ? 'border-danger' : 'border-control hover:border-muted';
