import {useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {ArrowLeft, FileText, Plus} from 'lucide-react';
import {Breadcrumb, Button, ConfirmDialog, IconButton, Menu, type MenuItem} from '../../ui';
import {useIsPhone} from '../../ui/internal/useIsPhone';
import {useAppState} from '../AppStateContext';
import {paths} from '../routes';

/**
 * Notebook context header. Desktop/tablet: breadcrumb, icon tile, h1, sources
 * chip, "Añadir fuente", menu. Phone (56 px): back button, truncated title, menu.
 */
export function NotebookHeader() {
  const navigate = useNavigate();
  const phone = useIsPhone();
  const {activeNotebook, folders, handleDeleteNotebook, openAddSource} = useAppState();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!activeNotebook) return null;
  const nb = activeNotebook;
  const folder = nb.folderId ? folders.find((f) => f.id === nb.folderId) : undefined;
  const sourcesCount = nb.sources.length;
  const sourcesLabel = `${sourcesCount} ${sourcesCount === 1 ? 'fuente' : 'fuentes'}`;
  const toSources = paths.notebookSegment(nb.id, 'FUENTES');
  const addSource = openAddSource;

  const items: MenuItem[] = [
    ...(phone ? [{id: 'add-source', label: 'Añadir fuente', icon: <Plus />, onSelect: addSource}] : []),
    // TODO(L4): wire rename and move once the library dialogs exist.
    {id: 'rename', label: 'Renombrar (próximamente)', onSelect: () => {}, disabled: true},
    {id: 'move', label: 'Mover a… (próximamente)', onSelect: () => {}, disabled: true},
    {id: 'delete', label: 'Eliminar', onSelect: () => setConfirmingDelete(true), danger: true},
  ];

  const dialog = (
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
  );

  if (phone) {
    return (
      <>
        <div className="flex h-14 items-center gap-1 border-b border-hairline">
          <IconButton
            aria-label="Volver a Mis cuadernos"
            icon={<ArrowLeft aria-hidden className="size-5" />}
            onClick={() => navigate(paths.notebooks())}
          />
          <h1 className="min-w-0 flex-1 truncate text-h3 font-semibold text-strong">{nb.title}</h1>
          <Menu label={`Opciones de ${nb.title}`} items={items} />
        </div>
        {dialog}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 pb-4">
        <Breadcrumb
          items={[
            {label: 'Mis cuadernos', to: paths.notebooks()},
            ...(folder ? [{label: folder.name, to: paths.notebooks()}] : []),
            {label: nb.title},
          ]}
        />
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-tile-azul text-h2"
          >
            {nb.icon || '📘'}
          </span>
          <h1 className="min-w-0 flex-1 truncate text-h1 font-semibold text-strong">{nb.title}</h1>
          <Link
            to={toSources}
            className="inline-flex h-8 shrink-0 items-center gap-2 rounded-pill bg-subtle px-3 text-label text-strong hover:bg-hairline"
          >
            <FileText aria-hidden className="size-4 text-muted" />
            {sourcesLabel}
          </Link>
          <Button variant="secondary" leadingIcon={<Plus aria-hidden className="size-5" />} onClick={addSource}>
            Añadir fuente
          </Button>
          <Menu label={`Opciones de ${nb.title}`} items={items} />
        </div>
      </div>
      {dialog}
    </>
  );
}
