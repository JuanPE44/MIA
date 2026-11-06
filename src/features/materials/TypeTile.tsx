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
  const Icon = info.icon;
  return (
    <button
      type="button"
      aria-disabled={disabled || undefined}
      aria-describedby={disabled ? describedBy : undefined}
      onClick={() => {
        if (!disabled) onSelect(info.id);
      }}
      className={`flex min-h-[120px] flex-col items-start gap-2 rounded-card border border-hairline bg-surface p-4 text-left transition-[box-shadow,border-color] duration-[120ms] ${
        disabled ? 'cursor-not-allowed opacity-40' : 'hover:border-control hover:shadow-elevation-1'
      }`}
    >
      <span aria-hidden className={`flex size-10 items-center justify-center rounded-control text-strong ${info.tileClass}`}>
        <Icon className="size-6" />
      </span>
      <span className="text-body-strong text-strong">{info.label}</span>
      <span className="text-small text-muted">{info.description}</span>
    </button>
  );
}
