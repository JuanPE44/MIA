import {cx} from '../internal/cx';

export interface AvatarProps {
  /** Person name: used for the initials fallback and as the image `alt`. */
  name: string;
  src?: string;
  size?: 32 | 40 | 64;
  className?: string;
}

const sizes = {32: 'size-8 text-caption', 40: 'size-10 text-label', 64: 'size-16 text-h2'} as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Circle with an image or initials on an accent tile. Decorative when a sibling names it. */
export function Avatar({name, src, size = 32, className}: AvatarProps) {
  const base = cx('inline-flex shrink-0 select-none items-center justify-center rounded-pill', sizes[size], className);
  if (src) {
    return <img src={src} alt={name} className={cx(base, 'object-cover')} />;
  }
  return (
    <span role="img" aria-label={name} className={cx(base, 'bg-tile-azul font-semibold text-strong')}>
      <span aria-hidden>{initials(name)}</span>
    </span>
  );
}
