import {useRef, type MouseEvent} from 'react';
import type {Folder, Notebook} from '../../types';
import {IconButton, InteractiveCard, Menu, Chip, RevealItem, type MenuItem} from '../../ui';
import {paths} from '../../app/routes';
import {countLabels, tileClassFor} from './libraryModel';
import {Icon, resolveItemIcon} from '../../ui/Icon';

interface NotebookCardProps {
  notebook: Notebook;
  folder?: Folder;
  /** Show the folder chip (hide it when the card is already inside its folder group). Default true. */
  showFolder?: boolean;
  onOpen: (notebookId: string) => void;
  onMove: (notebook: Notebook) => void;
  onDelete: (notebook: Notebook) => void;
}

export function NotebookCard({notebook, folder, showFolder = true, onOpen, onMove, onDelete}: NotebookCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sources = notebook.sources.length;
  const artifacts = notebook.artifacts?.length ?? 0;

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
            <span className="flex items-start gap-3 pr-8">
              <span
                aria-hidden
                className={`flex size-10 shrink-0 items-center justify-center rounded-control border border-rule ${tileClassFor(notebook.id)}`}
              >
                <Icon name={resolveItemIcon(notebook.icon, 'notebook')} weight="duotone" className="size-5 text-ink" />
              </span>
              <span className="min-w-0 line-clamp-2 break-words pt-0.5 font-display" title={notebook.title}>
                {notebook.title}
              </span>
            </span>
          }
          actions={
            <span className="mr-1 mt-1 inline-flex sm:mr-2 sm:mt-2">
              <Menu
                label={`Más opciones de ${notebook.title}`}
                items={items}
                contextTargetRef={wrapperRef}
                renderTrigger={(props) => (
                  <IconButton
                    {...props}
                    ref={props.ref}
                    size="sm"
                    aria-label={`Más opciones de ${notebook.title}`}
                    icon={<Icon name="more" className="size-4" />}
                    className="bg-surface/85 backdrop-blur-sm"
                  />
                )}
              />
            </span>
          }
        >
          {notebook.subject ? <p className="truncate text-small text-muted">{notebook.subject}</p> : null}
          {folder && showFolder ? (
            <Chip size="sm" variant="outline" className="mt-2 max-w-full" icon={<Icon name={resolveItemIcon(folder.icon, 'folder')} />}>
              <span className="truncate">{folder.name}</span>
            </Chip>
          ) : null}
          <div className="mt-4 flex items-center gap-3 whitespace-nowrap border-t border-rule pt-3 text-small text-muted">
            <span
              className="inline-flex items-center gap-1"
              title={sources === 0 ? 'Sin fuentes' : countLabels.sources(sources)}
            >
              <Icon name="document" className="size-4 shrink-0" />
              <span className="font-mono">{sources}</span>
              <span className="sr-only">{sources === 1 ? 'fuente' : 'fuentes'}</span>
            </span>
            <span
              className="inline-flex items-center gap-1"
              title={artifacts === 1 ? '1 material' : `${artifacts} materiales`}
            >
              <Icon name="sparkles" className="size-4 shrink-0" />
              <span className="font-mono">{artifacts}</span>
              <span className="sr-only">{artifacts === 1 ? 'material' : 'materiales'}</span>
            </span>
            {updatedLabel ? <span className="ml-auto truncate font-mono">{updatedLabel}</span> : null}
          </div>
        </InteractiveCard>
      </div>
    </RevealItem>
  );
}
