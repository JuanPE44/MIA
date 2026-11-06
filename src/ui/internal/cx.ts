export type ClassValue = string | false | null | undefined;

/** Joins truthy class names. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}

/**
 * Extends the hit area to >= 44px tall on touch devices without changing the
 * visual size (spec "Hit 44"). The element must not clip overflow.
 */
export const HIT_44 =
  "relative pointer-coarse:after:absolute pointer-coarse:after:content-[''] pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2";
