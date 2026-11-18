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
  /** `hero` = single-folder view; `compact` = section in "Todas". */
  size?: 'hero' | 'compact';
  /** When set, the banner and the name open (filter) the folder. */
  onOpen?: () => void;
}

export function FolderHeader({
  folder,
  notebookCount,
  onNewNotebook,
  onDelete,
  onChangeCover,
  size = 'hero',
  onOpen,
}: FolderHeaderProps) {
  const titleId = `folder-header-${folder.id}`;
  const banner = <FolderBanner folder={folder} size={size} />;
  const name = <span className="min-w-0 truncate">{folder.name}</span>;
  return (
    <section
      aria-labelledby={titleId}
      className={size === 'hero' ? 'overflow-hidden border-b border-rule' : 'flex flex-col gap-3'}
    >
      {onOpen ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={onOpen}
          className="block w-full cursor-pointer rounded-card text-left"
        >
          {banner}
        </button>
      ) : (
        banner
      )}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 ${size === 'hero' ? 'pb-2' : 'border-b border-rule pb-2'}`}
      >
        <div className="min-w-0">
          <span className="font-mono text-caption uppercase tracking-widest text-muted">Carpeta</span>
          <h2 id={titleId} className="flex items-center gap-2 font-display text-h2 text-strong">
            <Icon name="folder-open" weight="duotone" className="size-6 shrink-0 text-ink" />
            {onOpen ? (
              <button type="button" onClick={onOpen} className="min-w-0 cursor-pointer truncate text-left hover:underline">
                {folder.name}
              </button>
            ) : (
              name
            )}
          </h2>
          <p className="font-mono text-small text-muted">{countLabels.notebooks(notebookCount)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leadingIcon={<Icon name="add" />} onClick={onNewNotebook}>
            Nuevo cuaderno aquí
          </Button>
          <Menu
            label={`Opciones de la carpeta ${folder.name}`}
            items={[
              {id: 'cover', label: 'Cambiar portada', icon: <Icon name="source-image" />, onSelect: onChangeCover},
              {id: 'delete', label: 'Eliminar carpeta', icon: <Icon name="delete" />, danger: true, onSelect: onDelete},
            ]}
          />
        </div>
      </div>
    </section>
  );
}
