import {useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {Breadcrumb, Button, ConfirmDialog, IconButton, Menu, type MenuItem} from '../../ui';
import {useIsPhone} from '../../ui/internal/useIsPhone';
import {useAppState} from '../AppStateContext';
import {paths} from '../routes';
import {MoveNotebookDialog} from '../../features/library/MoveNotebookDialog';
import {Icon, resolveItemIcon} from '../../ui/Icon';

/**
 * Notebook context header. Desktop/tablet: breadcrumb, icon tile, h1, sources
 * chip, "Añadir fuente", menu. Phone (56 px): back button, truncated title, menu.
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
    ...(phone ? [{id: 'add-source', label: 'Añadir fuente', icon: <Icon name="add" />, onSelect: addSource}] : []),
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
      <div className="flex flex-col gap-3 pb-1">
        <Breadcrumb
          items={[
            {label: 'Biblioteca', to: paths.notebooks()},
            ...(folder ? [{label: folder.name, to: paths.notebooks()}] : []),
            {label: nb.title},
          ]}
        />
        {/* Editorial masthead: display title, mono metadata, ink rule */}
        <div className="flex items-end gap-4 border-b-2 border-ink pb-4">
          <span
            aria-hidden
            className="inline-flex size-14 shrink-0 items-center justify-center rounded-card border border-rule bg-tile-azul text-strong shadow-offset"
          >
            <Icon name={resolveItemIcon(nb.icon, 'notebook')} weight="duotone" className="size-8" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-caption uppercase tracking-widest text-muted">
              {nb.subject || 'General'}
              <span aria-hidden> · </span>
              <Link to={toSources} className="rounded-small underline-offset-4 hover:underline">
                {sourcesLabel}
              </Link>
            </p>
            <h1 className="truncate text-display font-medium text-strong">{nb.title}</h1>
          </div>
          <Button variant="secondary" leadingIcon={<Icon name="add" className="size-5" />} onClick={addSource}>
            Añadir fuente
          </Button>
          <Menu label={`Opciones de ${nb.title}`} items={items} />
        </div>
      </div>
      {dialog}
    </>
  );
}
