import {useEffect, useState} from 'react';
import {cx} from '../internal/cx';

export interface AvatarProps {
  /** Person name: used for the initials fallback and as the image `alt`. */
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {sm: 'size-8 text-caption', md: 'size-10 text-label', lg: 'size-16 text-h2'} as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Circle with an image or initials on an accent tile. Decorative when a sibling names it. */
export function Avatar({name, src, size = 'sm', className}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const base = cx('inline-flex shrink-0 select-none items-center justify-center rounded-pill', sizes[size], className);
  if (src && !failed) {
    return <img src={src} alt={name} referrerPolicy="no-referrer" onError={() => setFailed(true)} className={cx(base, 'object-cover')} />;
  }
  return (
    <span role="img" aria-label={name} className={cx(base, 'bg-tile-azul font-semibold text-strong')}>
      <span aria-hidden>{initials(name)}</span>
    </span>
  );
}
