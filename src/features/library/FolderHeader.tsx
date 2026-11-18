import type {Folder} from '../../types';
import {Button, Menu} from '../../ui';
import {countLabels} from './libraryModel';
import {FolderBanner} from './FolderBanner';
import {Icon} from '../../ui/Icon';

interface FolderHeaderProps {
  folder: Folder;
  notebookCount: number;
  onNewNotebook: () => void;
  onDelete: () => void;
  onChangeCover: () => void;
  /** When set, the cover and the name open (filter) the folder. */
  onOpen?: () => void;
}

/** One tidy row: small cover + name/count on the left, new-notebook button + kebab on the right. */
export function FolderHeader({folder, notebookCount, onNewNotebook, onDelete, onChangeCover, onOpen}: FolderHeaderProps) {
  const titleId = `folder-header-${folder.id}`;
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-rule pb-3"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onOpen ? (
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={onOpen} className="shrink-0 cursor-pointer rounded-control">
            <FolderBanner folder={folder} />
          </button>
        ) : (
          <FolderBanner folder={folder} />
        )}
        <div className="min-w-0">
          <h2 id={titleId} className="font-display text-h2 text-strong">
            {onOpen ? (
              <button
                type="button"
                onClick={onOpen}
                className="block max-w-full cursor-pointer truncate rounded-control text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {folder.name}
              </button>
            ) : (
              <span className="block truncate">{folder.name}</span>
            )}
          </h2>
          <p className="font-mono text-small text-muted">{countLabels.notebooks(notebookCount)}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary" leadingIcon={<Icon name="add" />} onClick={onNewNotebook}>
          <span className="sm:hidden">Nuevo</span>
          <span className="hidden sm:inline">Nuevo cuaderno aquí</span>
        </Button>
        <Menu
          label={`Opciones de la carpeta ${folder.name}`}
          items={[
            {id: 'cover', label: 'Cambiar portada', icon: <Icon name="source-image" />, onSelect: onChangeCover},
            {id: 'delete', label: 'Eliminar carpeta', icon: <Icon name="delete" />, danger: true, onSelect: onDelete},
          ]}
        />
      </div>
    </section>
  );
}
