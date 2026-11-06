import {Loader2} from 'lucide-react';
import {cx} from '../internal/cx';

export interface SpinnerProps {
  size?: 16 | 20 | 24;
  /** Accessible label. When set the spinner is a `role="status"`; otherwise it is decorative. */
  label?: string;
  className?: string;
}

const px = {16: 'size-4', 20: 'size-5', 24: 'size-6'} as const;

export function Spinner({size = 20, label, className}: SpinnerProps) {
  const icon = (
    <Loader2
      aria-hidden
      className={cx('animate-spin text-primary-text', px[size], className)}
    />
  );
  if (!label) return icon;
  return (
    <span role="status" className="inline-flex">
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}
