const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * "2026-10-02 11:25" -> "2 oct · 11:25"; "2026-09-28" -> "28 sep";
 * "28/9/2026" -> "28 sep". Other formats pass through unchanged.
 */
export function formatShortDate(raw: string): string {
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/.exec(raw);
  const es = iso ? null : /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
  const [day, month, time] = iso ? [iso[3], iso[2], iso[4]] : es ? [es[1], es[2], undefined] : [];
  if (!day || !month) return raw;
  const label = `${Number(day)} ${MONTHS[Number(month) - 1] ?? ''}`.trim();
  return time ? `${label} · ${time}` : label;
}
