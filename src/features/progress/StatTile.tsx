import type {ReactNode} from 'react';
import {Card} from '../../ui';

interface StatTileProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  hint?: string;
}

/** Metric card: icon in a tint circle, tabular value, label and optional explanation (spec 6.3). */
export function StatTile({icon, value, label, hint}: StatTileProps) {
  return (
    <Card className="flex h-full flex-col gap-2">
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-pill bg-primary-tint text-primary-on-tint [&>svg]:size-5"
      >
        {icon}
      </span>
      <p className="text-h1 text-strong tabular-nums">{value}</p>
      <p className="text-small text-default">{label}</p>
      {hint ? <p className="text-small text-muted">{hint}</p> : null}
    </Card>
  );
}
