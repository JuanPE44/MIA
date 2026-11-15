import type {ReactNode} from 'react';
import type {Folder} from '../../types';
import {Chip, Icon, resolveItemIcon} from '../../ui';
import {LOOSE_FILTER} from './libraryModel';

interface FolderFilterProps {
  folders: Folder[];
  /** `null` = Todos, LOOSE_FILTER = Sin carpeta, otherwise a folder id. */
  selected: string | null;
  counts: Record<string, number>;
  totalCount: number;
  looseCount: number;
  onSelect: (value: string | null) => void;
}

export function FolderFilter({folders, selected, counts, totalCount, looseCount, onSelect}: FolderFilterProps) {
  const chip = (key: string | null, content: ReactNode, count: number, name: string) => (
    <Chip
      key={key ?? 'all'}
      variant="selectable"
      selected={selected === key}
      onSelectedChange={(next) => onSelect(next ? key : null)}
      className="shrink-0 whitespace-nowrap"
    >
      <span className="sr-only">{name}, </span>
      {content}
      <span aria-hidden className="font-mono text-muted">
        {count}
      </span>
      <span className="sr-only">{count === 1 ? '1 cuaderno' : `${count} cuadernos`}</span>
    </Chip>
  );

  return (
    <div role="group" aria-label="Filtrar por carpeta" className="-my-2 flex gap-2 overflow-x-auto py-2 sm:flex-wrap">
      {chip(null, <span aria-hidden>Todos</span>, totalCount, 'Todos')}
      {folders.map((f) =>
        chip(
          f.id,
          <>
            <Icon name={resolveItemIcon(f.icon, 'folder')} />
            <span aria-hidden>{f.name}</span>
          </>,
          counts[f.id] ?? 0,
          f.name,
        ),
      )}
      {chip(LOOSE_FILTER, <span aria-hidden>Sin carpeta</span>, looseCount, 'Sin carpeta')}
    </div>
  );
}
