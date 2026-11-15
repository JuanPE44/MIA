import {cx} from '../internal/cx';

export interface AppMarkProps {
  /** Pixel size (square). Default 24; stays crisp at 16. */
  size?: number;
  /** Accessible name; omit for a decorative mark (aria-hidden). */
  label?: string;
  className?: string;
}

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300];

/**
 * App mark: simplified flower, six stroked petals in ink blue (`currentColor`,
 * defaults to `--mia-primary`) around a hexagon filled with the highlighter.
 * Mirrors `public/favicon.svg`.
 */
export function AppMark({size = 24, label, className}: AppMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={cx('shrink-0 text-primary', className)}
    >
      <g stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        {PETAL_ANGLES.map((a) => (
          <ellipse key={a} cx="12" cy="6" rx="2.4" ry="3.9" transform={`rotate(${a} 12 12)`} />
        ))}
      </g>
      <polygon
        points="12,8.6 14.95,10.3 14.95,13.7 12,15.4 9.05,13.7 9.05,10.3"
        fill="var(--mia-highlight)"
        stroke="var(--mia-ink)"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}
