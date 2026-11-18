import {useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {ConfirmDialog, IconButton, Menu, type MenuItem} from '../../ui';
import {useIsPhone} from '../../ui/internal/useIsPhone';
import {useAppState} from '../AppStateContext';
import {paths} from '../routes';
import {MoveNotebookDialog} from '../../features/library/MoveNotebookDialog';
import {RenameNotebookDialog} from '../../features/library/RenameNotebookDialog';
import {Icon} from '../../ui/Icon';

/**
 * Notebook context header. Desktop/tablet: back link to the (folder-filtered)
 * Library, then title + muted subject + menu; the tabs row follows.
 * "Añadir fuente" lives in the menu and Fuentes. Phone (56 px): back button, truncated title, menu.
 */
export function NotebookHeader() {
  const navigate = useNavigate();
  const phone = useIsPhone();
  const {activeNotebook, folders, handleDeleteNotebook, handleMoveNotebook, handleRenameNotebook, openAddSource} = useAppState();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [moving, setMoving] = useState(false);
  const [renaming, setRenaming] = useState(false);

  if (!activeNotebook) return null;
  const nb = activeNotebook;
  const folder = nb.folderId ? folders.find((f) => f.id === nb.folderId) : undefined;
  const backTo = folder ? `${paths.notebooks()}?carpeta=${encodeURIComponent(folder.id)}` : paths.notebooks();
  const addSource = openAddSource;

  const items: MenuItem[] = [
    {id: 'add-source', label: 'Añadir fuente', icon: <Icon name="add" />, onSelect: addSource},
    {id: 'rename', label: 'Renombrar', onSelect: () => setRenaming(true)},
    {id: 'move', label: 'Mover a…', onSelect: () => setMoving(true)},
    {id: 'delete', label: 'Eliminar', onSelect: () => setConfirmingDelete(true), danger: true},
  ];

  const dialog = (
    <>
    {renaming ? (
      <RenameNotebookDialog
        notebook={nb}
        onClose={() => setRenaming(false)}
        onRename={(title) => handleRenameNotebook(nb.id, title)}
      />
    ) : null}
    {moving ? (
      <MoveNotebookDialog
        notebook={nb}
        folders={folders}
        onClose={() => setMoving(false)}
        onMove={(folderId) => handleMoveNotebook(nb.id, folderId)}
      />
    ) : null}
    <ConfirmDialog
      open={confirmingDelete}
      onCancel={() => setConfirmingDelete(false)}
      onConfirm={() => {
        setConfirmingDelete(false);
        handleDeleteNotebook(nb.id);
      }}
      title={`¿Eliminar el cuaderno «${nb.title}»?`}
      description="Se borrarán sus fuentes, chats y materiales. No se puede deshacer."
    />
    </>
  );

  if (phone) {
    return (
      <>
        <div className="flex h-14 items-center gap-1 border-b border-rule">
          <IconButton
            aria-label="Volver a Mis cuadernos"
            icon={<Icon name="back" className="size-5" />}
            onClick={() => navigate(paths.notebooks())}
          />
          <h1 title={nb.title} className="min-w-0 flex-1 truncate text-h2 font-bold text-strong">{nb.title}</h1>
          <Menu label={`Opciones de ${nb.title}`} items={items} />
        </div>
        {dialog}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1 pb-2">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1 self-start rounded-small text-small text-muted underline-offset-4 hover:text-strong hover:underline"
        >
          <Icon name="chevron-left" aria-hidden className="size-4" />
          {folder ? folder.name : 'Biblioteca'}
        </Link>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 title={nb.title} className="max-w-full truncate font-display text-[34px] font-bold leading-tight tracking-tight text-strong">{nb.title}</h1>
            <p className="text-small text-muted">{nb.subject || 'General'}</p>
          </div>
          <Menu label={`Opciones de ${nb.title}`} items={items} />
        </div>
      </div>
      {dialog}
    </>
  );
}
