import {Card, InteractiveCard} from '../../ui';
import {Icon} from '../../ui/Icon';
import type {MaterialTypeInfo} from './materialModel';

interface TypeTileProps {
  info: MaterialTypeInfo;
  /** No sources: dimmed; the shared alert above the grid explains why. */
  disabled?: boolean;
  describedBy?: string;
  onSelect: (type: MaterialTypeInfo['id']) => void;
}

/** One of the 8 "Crear material" tiles. */
export function TypeTile({info, disabled, describedBy, onSelect}: TypeTileProps) {
  const content = (
    <>
      <span aria-hidden className={`flex size-10 items-center justify-center rounded-control border border-rule text-strong ${info.tileClass}`}>
        <Icon name={info.icon} weight="duotone" className="size-6" />
      </span>
      <span className="mt-2 block font-mono text-caption uppercase tracking-widest text-muted">{info.label}</span>
      <span className="mt-1 block text-small text-default">{info.description}</span>
    </>
  );

  if (disabled) {
    return (
      <Card aria-disabled="true" aria-describedby={describedBy} className="h-full min-h-32 cursor-not-allowed opacity-40">
        {content}
      </Card>
    );
  }

  return (
    <InteractiveCard
      className="h-full min-h-32"
      headingLevel={3}
      title={<span className="sr-only">{info.label}</span>}
      onClick={() => onSelect(info.id)}
    >
      {content}
    </InteractiveCard>
  );
}
