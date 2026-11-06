import {Plus, Trash2} from 'lucide-react';
import type {Folder} from '../../types';
import {Button, Menu} from '../../ui';
import {countLabels} from './libraryModel';

interface FolderHeaderProps {
  folder: Folder;
  notebookCount: number;
  onNewNotebook: () => void;
  onDelete: () => void;
}

export function FolderHeader({folder, notebookCount, onNewNotebook, onDelete}: FolderHeaderProps) {
  return (
    <section aria-labelledby="folder-header-title" className="overflow-hidden rounded-card border border-hairline bg-surface">
      {folder.coverImage ? (
        <img src={folder.coverImage} alt="" className="aspect-[16/5] max-h-56 w-full object-cover" />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <h2 id="folder-header-title" className="text-h2 text-strong">
            <span aria-hidden>{folder.icon || '📁'} </span>
            {folder.name}
          </h2>
          <p className="text-small text-muted">{countLabels.notebooks(notebookCount)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leadingIcon={<Plus aria-hidden />} onClick={onNewNotebook}>
            Nuevo cuaderno aquí
          </Button>
          <Menu
            label={`Opciones de la carpeta ${folder.name}`}
            items={[{id: 'delete', label: 'Eliminar carpeta', icon: <Trash2 />, danger: true, onSelect: onDelete}]}
          />
        </div>
      </div>
    </section>
  );
}
