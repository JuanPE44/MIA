import {cx} from '../internal/cx';

export interface AppMarkProps {
  /** Pixel size (square). Default 24. */
  size?: number;
  /** Accessible name; omit for a decorative mark (aria-hidden). */
  label?: string;
  className?: string;
}

/** Brand logo (glowing flower on navy), served from `public/brand/mia-logo.png`. */
const LOGO_SRC = '/brand/mia-logo.png';

/** App mark: the MIA brand logo, rendered as a rounded square image. */
export function AppMark({size = 24, label, className}: AppMarkProps) {
  return (
    <img
      src={LOGO_SRC}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      className={cx('shrink-0 rounded-[22%] object-cover', className)}
    />
  );
}
