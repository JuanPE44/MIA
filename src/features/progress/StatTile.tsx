import type {ReactNode} from 'react';
import {Card} from '../../ui';

interface StatTileProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  hint?: string;
}

/** Metric card: duotone icon, big mono value, mono unit label and optional explanation. */
export function StatTile({icon, value, label, hint}: StatTileProps) {
  return (
    <Card className="flex h-full flex-col gap-2">
      <span aria-hidden className="text-primary-text [&>svg]:size-6">
        {icon}
      </span>
      <p className="font-mono text-h1 font-semibold text-strong tabular-nums">{value}</p>
      <p className="font-mono text-caption uppercase tracking-wide text-default">{label}</p>
      {hint ? <p className="text-small text-muted">{hint}</p> : null}
    </Card>
  );
}
