import type {IconWeight} from '@phosphor-icons/react';
import {ICONS, LEGACY_EMOJI_TO_KEY, type IconName} from './icons';

export type IconWeightName = Extract<IconWeight, 'regular' | 'duotone' | 'fill' | 'bold'>;

export interface IconProps {
  name: IconName;
  /** Pixel size or CSS length. Defaults to `1em`, so Tailwind `size-*` classes work. */
  size?: number | string;
  /** `regular` (default), `duotone` (empty states, tiles), `fill` (active navigation). */
  weight?: IconWeightName;
  className?: string;
  /** Accessible name. When omitted the icon is decorative (`aria-hidden`). */
  label?: string;
}

/** The only way screens render icons; wraps the Phosphor registry in `icons.ts`. */
export function Icon({name, size = '1em', weight = 'regular', className, label}: IconProps) {
  const Glyph = ICONS[name];
  return (
    <Glyph
      size={size}
      weight={weight}
      className={className}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
    />
  );
}

/**
 * Read-time mapping of a stored notebook/folder icon (a registry key, or a
 * legacy emoji / unknown value) to a registry key.
 */
export function resolveItemIcon(value: string | undefined | null, fallback: IconName = 'notebook'): IconName {
  if (!value) return fallback;
  if (value in ICONS) return value as IconName;
  return LEGACY_EMOJI_TO_KEY[value] ?? LEGACY_EMOJI_TO_KEY[value.replace(/️/g, '')] ?? fallback;
}
