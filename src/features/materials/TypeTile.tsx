import {Card, InteractiveCard} from '../../ui';
import {Icon} from '../../ui/Icon';
import type {MaterialTypeInfo} from './materialModel';

interface TypeTileProps {
  info: MaterialTypeInfo;
  /** No sources: dimmed; the shared alert above the grid explains why. */
  disabled?: boolean;
  describedBy?: string;
  /** Type not included in the current plan: shown with a lock; selecting it opens the plans screen. */
  locked?: boolean;
  onSelect: (type: MaterialTypeInfo['id']) => void;
}

/** Gradient band with the type icon in a raised chip. */
function TileBand({info}: {info: MaterialTypeInfo}) {
  return (
    <div
      aria-hidden
      className="flex h-24 items-center justify-center rounded-t-[calc(var(--radius-card)-1px)] border-b border-rule"
      style={{backgroundImage: info.gradient}}
    >
      <span className="flex size-14 items-center justify-center rounded-control border border-ink/15 bg-surface text-strong shadow-[2px_2px_0_color-mix(in_oklab,var(--color-ink)_15%,transparent)]">
        <Icon name={info.icon} weight="duotone" className="size-8" />
      </span>
    </div>
  );
}

function TileDetails({info, locked}: {info: MaterialTypeInfo; locked?: boolean}) {
  return (
    <>
      <span className="block text-small text-muted">{info.description}</span>
      {locked ? (
        <span className="mt-2 flex items-center gap-1 text-caption font-medium text-muted">
          <Icon name="lock" className="size-3.5" /> No está en tu plan
        </span>
      ) : null}
    </>
  );
}

/** One of the 8 "Crear material" tiles. */
export function TypeTile({info, disabled, describedBy, locked, onSelect}: TypeTileProps) {
  const title = <span className="font-bold">{info.label}</span>;

  if (disabled) {
    return (
      <Card flush aria-disabled="true" aria-describedby={describedBy} className="flex h-full cursor-not-allowed flex-col opacity-40">
        <TileBand info={info} />
        <div className="p-4 sm:p-5">
          <h3 className="text-h3 text-strong">{title}</h3>
          <div className="mt-1">
            <TileDetails info={info} locked={locked} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <InteractiveCard
      className="h-full"
      headingLevel={3}
      title={title}
      media={<TileBand info={info} />}
      onClick={() => onSelect(info.id)}
    >
      <TileDetails info={info} locked={locked} />
    </InteractiveCard>
  );
}
