import {useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {Breadcrumb, ConfirmDialog, IconButton, Menu, type MenuItem} from '../../ui';
import {useIsPhone} from '../../ui/internal/useIsPhone';
import {useAppState} from '../AppStateContext';
import {paths} from '../routes';
import {MoveNotebookDialog} from '../../features/library/MoveNotebookDialog';
import {Icon, resolveItemIcon} from '../../ui/Icon';

/**
 * Notebook context header. Desktop/tablet: breadcrumb, one title row (small
 * icon, h1, mono metadata, menu); "Añadir fuente" lives in the menu and Fuentes. Phone (56 px): back button, truncated title, menu.
 */
export function NotebookHeader() {
  const navigate = useNavigate();
  const phone = useIsPhone();
  const {activeNotebook, folders, handleDeleteNotebook, handleMoveNotebook, openAddSource} = useAppState();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [moving, setMoving] = useState(false);

  if (!activeNotebook) return null;
  const nb = activeNotebook;
  const folder = nb.folderId ? folders.find((f) => f.id === nb.folderId) : undefined;
  const sourcesCount = nb.sources.length;
  const sourcesLabel = `${sourcesCount} ${sourcesCount === 1 ? 'fuente' : 'fuentes'}`;
  const toSources = paths.notebookSegment(nb.id, 'FUENTES');
  const addSource = openAddSource;

  const items: MenuItem[] = [
    {id: 'add-source', label: 'Añadir fuente', icon: <Icon name="add" />, onSelect: addSource},
    // TODO: rename needs a notebook-rename action and dialog; neither exists yet.
    {id: 'rename', label: 'Renombrar (próximamente)', onSelect: () => {}, disabled: true},
    {id: 'move', label: 'Mover a…', onSelect: () => setMoving(true)},
    {id: 'delete', label: 'Eliminar', onSelect: () => setConfirmingDelete(true), danger: true},
  ];

  const dialog = (
    <>
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
          <h1 className="min-w-0 flex-1 truncate text-h2 font-medium text-strong">{nb.title}</h1>
          <Menu label={`Opciones de ${nb.title}`} items={items} />
        </div>
        {dialog}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 pb-2">
        <Breadcrumb
          items={[
            {label: 'Biblioteca', to: paths.notebooks()},
            ...(folder ? [{label: folder.name, to: paths.notebooks()}] : []),
            {label: nb.title},
          ]}
        />
        {/* Compact masthead: one band, title + inline mono metadata, tabs follow with a single rule */}
        <div className="flex items-center gap-3">
          <Icon
            name={resolveItemIcon(nb.icon, 'notebook')}
            weight="duotone"
            aria-hidden
            className="size-6 shrink-0 text-muted"
          />
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3">
            <h1 className="min-w-0 max-w-full truncate font-display text-h1 text-strong">{nb.title}</h1>
            <p className="shrink-0 font-mono text-caption text-muted">
              {nb.subject || 'General'}
              <span aria-hidden> · </span>
              <Link to={toSources} className="rounded-small underline-offset-4 hover:underline">
                {sourcesLabel}
              </Link>
            </p>
          </div>
          <Menu label={`Opciones de ${nb.title}`} items={items} />
        </div>
      </div>
      {dialog}
    </>
  );
}
