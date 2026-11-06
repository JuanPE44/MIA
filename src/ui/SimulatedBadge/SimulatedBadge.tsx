import {useEffect, useId, useState} from 'react';
import {FlaskConical} from 'lucide-react';
import {AI_SIMULATED} from '../AI_SIMULATED';
import {cx} from '../internal/cx';

export const SIMULATED_EXPLANATION = 'Respuesta de ejemplo: la IA todavía no está conectada.';

export interface SimulatedBadgeProps {
  className?: string;
}

/**
 * "Simulado" badge, required on every AI output while the AI is mocked.
 * Renders nothing when `AI_SIMULATED` is false. The explanation shows on hover,
 * focus and tap (toggle); Escape closes it.
 */
export function SimulatedBadge({className}: SimulatedBadgeProps) {
  const tipId = useId();
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPinned(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pinned]);

  if (!AI_SIMULATED) return null;

  return (
    <span className={cx('group relative inline-flex', className)}>
      <button
        type="button"
        aria-describedby={tipId}
        aria-expanded={pinned}
        onClick={() => setPinned((p) => !p)}
        onBlur={() => setPinned(false)}
        className="relative inline-flex h-6 items-center gap-1 rounded-pill bg-simulated-tint px-2 text-caption text-simulated pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2.5 pointer-coarse:after:content-['']"
      >
        <FlaskConical aria-hidden className="size-3.5" />
        Simulado
      </button>
      <span
        id={tipId}
        role="tooltip"
        className={cx(
          'absolute left-0 top-full z-30 mt-1 w-64 rounded-small border border-hairline bg-surface-raised p-2',
          'text-small text-default shadow-elevation-2',
          pinned ? 'block' : 'hidden group-hover:block group-has-[:focus-visible]:block',
        )}
      >
        {SIMULATED_EXPLANATION}
      </span>
    </span>
  );
}
