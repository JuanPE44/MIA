import type {ReactNode} from 'react';
import type {Folder} from '../../types';
import {Icon} from '../../ui';
import {cx} from '../../ui/internal/cx';
import {LOOSE_FILTER, countLabels, tileClassFor} from './libraryModel';

interface FolderFilterProps {
  folders: Folder[];
  /** `null` = Todas, LOOSE_FILTER = Sin carpeta, otherwise a folder id. */
  selected: string | null;
  counts: Record<string, number>;
  totalCount: number;
  looseCount: number;
  onSelect: (value: string | null) => void;
}

export function FolderFilter({folders, selected, counts, totalCount, looseCount, onSelect}: FolderFilterProps) {
  const chip = (key: string | null, label: string, count: number, dot?: string, explicit = false) => {
    const isSelected = selected === key;
    return (
      <button
        key={key ?? 'all'}
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(isSelected ? null : key)}
        className={cx(
          'relative inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-control border px-3 text-label transition-colors duration-[120ms]',
          'pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2 pointer-coarse:after:content-[""]',
          isSelected
            ? 'border-ink bg-subtle font-semibold text-strong'
            : 'border-rule bg-surface text-default hover:border-ink',
        )}
      >
        <Icon name={isSelected ? 'folder-open' : 'folder'} weight={isSelected ? 'fill' : 'regular'} className="size-4" />
        {dot ? <span aria-hidden className={cx('size-2.5 rounded-full border border-ink/40', dot)} /> : null}
        <span className="sr-only">{label}, </span>
        <span aria-hidden>{label}</span>
        <span aria-hidden className={cx('font-mono text-small', isSelected ? 'text-highlight-ink' : 'text-muted')}>
          {explicit ? countLabels.notebooks(count) : count}
        </span>
        <span className="sr-only">{countLabels.notebooks(count)}</span>
      </button>
    );
  };

  const row: ReactNode[] = [
    chip(null, 'Todas', totalCount, undefined, true),
    ...folders.map((f) => chip(f.id, f.name, counts[f.id] ?? 0, tileClassFor(f.id))),
    chip(LOOSE_FILTER, 'Sin carpeta', looseCount),
  ];

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-caption uppercase tracking-widest text-muted">Carpetas</p>
      <div role="group" aria-label="Filtrar por carpeta" className="-my-2 flex gap-2 overflow-x-auto py-2 sm:flex-wrap">
        {row}
      </div>
    </div>
  );
}
