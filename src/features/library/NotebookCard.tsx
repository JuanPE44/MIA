import {useRef, type MouseEvent} from 'react';
import type {Folder, Notebook} from '../../types';
import {InteractiveCard, Menu, Chip, RevealItem, type MenuItem} from '../../ui';
import {paths} from '../../app/routes';
import {countLabels, tileClassFor} from './libraryModel';
import {Icon, resolveItemIcon} from '../../ui/Icon';

interface NotebookCardProps {
  notebook: Notebook;
  folder?: Folder;
  onOpen: (notebookId: string) => void;
  onMove: (notebook: Notebook) => void;
  onDelete: (notebook: Notebook) => void;
}

export function NotebookCard({notebook, folder, onOpen, onMove, onDelete}: NotebookCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sources = notebook.sources.length;

  const open = () => onOpen(notebook.id);

  // The whole card is one real link (middle/ctrl-click keep native behavior);
  // plain clicks and Enter navigate client-side so the session is not lost.
  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open();
  };

  const items: MenuItem[] = [
    {id: 'open', label: 'Abrir', icon: <Icon name="book" />, onSelect: open},
    {id: 'move', label: 'Mover a…', icon: <Icon name="folder-move" />, onSelect: () => onMove(notebook)},
    {id: 'delete', label: 'Eliminar', icon: <Icon name="delete" />, danger: true, onSelect: () => onDelete(notebook)},
  ];

  const updated = new Date(notebook.updatedAt);
  const updatedLabel = Number.isNaN(updated.getTime())
    ? null
    : updated.toLocaleDateString('es', {day: 'numeric', month: 'short'});

  return (
    <RevealItem as="li" className="h-full">
      <div ref={wrapperRef} className="h-full">
        <InteractiveCard
          className="h-full"
          href={paths.notebookSegment(notebook.id, 'CHAT')}
          onClick={handleClick}
          title={
            <span className="flex flex-col gap-3 pr-10">
              <span
                aria-hidden
                className={`flex h-20 items-end rounded-control border border-rule p-3 ${tileClassFor(notebook.id)}`}
              >
                <Icon name={resolveItemIcon(notebook.icon, 'notebook')} weight="duotone" className="size-10 text-ink" />
              </span>
              <span className="min-w-0 line-clamp-2 break-words font-display">{notebook.title}</span>
            </span>
          }
          actions={
            <Menu label={`Más opciones de ${notebook.title}`} items={items} contextTargetRef={wrapperRef} />
          }
        >
          <p className="text-small text-muted">{notebook.subject}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {folder ? (
              <Chip size="sm" variant="outline" className="max-w-full" icon={<Icon name={resolveItemIcon(folder.icon, 'folder')} />}>
                <span className="truncate">{folder.name}</span>
              </Chip>
            ) : null}
            <span className="font-mono text-small text-muted">
              {sources === 0 ? 'Sin fuentes' : countLabels.sources(sources)}
              {updatedLabel ? ` · ${updatedLabel}` : ''}
            </span>
          </div>
        </InteractiveCard>
      </div>
    </RevealItem>
  );
}
