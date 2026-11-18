import type {ReactNode} from 'react';
import {Card} from '../../ui';
import {Icon} from '../../ui/Icon';

interface StatTileProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  hint?: string;
}

/** Compact metric card: duotone icon, big mono value, mono label. `hint` lives in an info tooltip. */
export function StatTile({icon, value, label, hint}: StatTileProps) {
  return (
    <Card className="relative flex h-full flex-col gap-1">
      <span aria-hidden className="text-primary-text [&>svg]:size-6">
        {icon}
      </span>
      <p className="font-mono text-h1 font-semibold text-strong tabular-nums">{value}</p>
      <p className="font-mono text-caption uppercase tracking-wide text-default">{label}</p>
      {hint ? (
        <span
          role="img"
          tabIndex={0}
          title={hint}
          aria-label={hint}
          className="absolute right-3 top-3 text-muted hover:text-strong focus-visible:text-strong"
        >
          <Icon name="info" className="size-4" />
        </span>
      ) : null}
    </Card>
  );
}
