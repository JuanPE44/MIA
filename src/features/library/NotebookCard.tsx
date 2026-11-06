import {useRef, type MouseEvent} from 'react';
import {BookOpen, FolderInput, Trash2} from 'lucide-react';
import type {Folder, Notebook} from '../../types';
import {InteractiveCard, Menu, Chip, type MenuItem} from '../../ui';
import {paths} from '../../app/routes';
import {countLabels, tileClassFor} from './libraryModel';

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
    {id: 'open', label: 'Abrir', icon: <BookOpen />, onSelect: open},
    {id: 'move', label: 'Mover a…', icon: <FolderInput />, onSelect: () => onMove(notebook)},
    {id: 'delete', label: 'Eliminar', icon: <Trash2 />, danger: true, onSelect: () => onDelete(notebook)},
  ];

  return (
    <div ref={wrapperRef} className="h-full">
      <InteractiveCard
        className="h-full"
        href={paths.notebookSegment(notebook.id, 'CHAT')}
        onClick={handleClick}
        title={
          <span className="flex items-center gap-3 pr-10">
            <span
              aria-hidden
              className={`flex size-10 shrink-0 items-center justify-center rounded-control text-xl ${tileClassFor(notebook.id)}`}
            >
              {notebook.icon || '📘'}
            </span>
            <span className="line-clamp-2">{notebook.title}</span>
          </span>
        }
        actions={
          <Menu label={`Más opciones de ${notebook.title}`} items={items} contextTargetRef={wrapperRef} />
        }
      >
        <p className="text-small text-muted">{notebook.subject}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {folder ? (
            <Chip size="sm" variant="outline" icon={<span>{folder.icon || '📁'}</span>}>
              {folder.name}
            </Chip>
          ) : null}
          <span className="text-small text-muted">
            {sources === 0 ? 'Sin fuentes' : countLabels.sources(sources)}
          </span>
        </div>
      </InteractiveCard>
    </div>
  );
}
