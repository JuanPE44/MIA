import {useMemo, useRef, useState, type ReactNode} from 'react';
import {useSearchParams} from 'react-router';
import {FolderPlus, Plus, Search, BookOpen, SearchX, FolderOpen} from 'lucide-react';
import {useAppState} from '../../app/AppStateContext';
import type {Notebook} from '../../types';
import {Button, ConfirmDialog, EmptyState, Menu, TextField, useToast} from '../../ui';
import {FolderFilter} from './FolderFilter';
import {FolderHeader} from './FolderHeader';
import {MoveNotebookDialog} from './MoveNotebookDialog';
import {NewFolderDialog} from './NewFolderDialog';
import {NewNotebookDialog} from './NewNotebookDialog';
import {NotebookCard} from './NotebookCard';
import {NotebookGrid} from './NotebookGrid';
import {LOOSE_FILTER, countLabels, isLoose, matchesQuery} from './libraryModel';

/** "Mis cuadernos" (S2): folders + notebooks, search, filter, create/move/delete with undo. */
export function LibraryScreen() {
  const {
    folders,
    notebooks,
    handleOpenNotebook,
    handleCreateNotebook,
    handleDeleteNotebook,
    handleRestoreNotebook,
    handleMoveNotebook,
    handleCreateFolder,
    handleDeleteFolder,
  } = useAppState();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [newNotebookOpen, setNewNotebookOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [moving, setMoving] = useState<Notebook | null>(null);
  const [deleting, setDeleting] = useState<Notebook | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  const query = params.get('q') ?? '';
  const folderParam = params.get('carpeta');
  const selected =
    folderParam === LOOSE_FILTER || folders.some((f) => f.id === folderParam) ? folderParam : null;
  const selectedFolder = folders.find((f) => f.id === selected);

  const updateParams = (patch: {q?: string; carpeta?: string | null}) => {
    const next = new URLSearchParams(params);
    if (patch.q !== undefined) patch.q ? next.set('q', patch.q) : next.delete('q');
    if (patch.carpeta !== undefined) patch.carpeta ? next.set('carpeta', patch.carpeta) : next.delete('carpeta');
    setParams(next, {replace: true});
  };

  const folderOf = (nb: Notebook) => folders.find((f) => f.id === nb.folderId);

  // Notebooks matching the search (before the folder filter) feed chip counts.
  const searched = useMemo(
    () => notebooks.filter((nb) => matchesQuery(nb, folderOf(nb), query)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notebooks, folders, query],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const nb of searched) if (nb.folderId) c[nb.folderId] = (c[nb.folderId] ?? 0) + 1;
    return c;
  }, [searched]);
  const looseCount = searched.filter((nb) => isLoose(nb, folders)).length;

  const visible = searched.filter((nb) => {
    if (!selected) return true;
    if (selected === LOOSE_FILTER) return isLoose(nb, folders);
    return nb.folderId === selected;
  });

  const totalSources = notebooks.reduce((acc, nb) => acc + nb.sources.length, 0);
  const accountEmpty = notebooks.length === 0 && folders.length === 0;

  // --- actions -----------------------------------------------------------
  const confirmDelete = () => {
    if (!deleting) return;
    const nb = deleting;
    const index = notebooks.findIndex((n) => n.id === nb.id);
    setDeleting(null);
    handleDeleteNotebook(nb.id);
    headingRef.current?.focus();
    toast.show({
      message: 'Cuaderno eliminado',
      variant: 'success',
      action: {label: 'Deshacer', onAction: () => handleRestoreNotebook(nb, index)},
    });
  };

  const moveNotebook = (nb: Notebook, folderId: string | null) => {
    const previous = nb.folderId ?? null;
    handleMoveNotebook(nb.id, folderId);
    const target = folders.find((f) => f.id === folderId)?.name ?? 'Sin carpeta';
    toast.show({
      message: `Movido a ${target}`,
      variant: 'success',
      action: {label: 'Deshacer', onAction: () => handleMoveNotebook(nb.id, previous)},
    });
  };

  const confirmDeleteFolder = () => {
    const id = deletingFolderId;
    setDeletingFolderId(null);
    if (!id) return;
    handleDeleteFolder(id);
    if (selected === id) updateParams({carpeta: null});
    headingRef.current?.focus();
    toast.show({message: 'Carpeta eliminada', variant: 'success'});
  };

  const folderToDelete = folders.find((f) => f.id === deletingFolderId);
  const folderToDeleteCount = notebooks.filter((nb) => nb.folderId === deletingFolderId).length;

  const renderCard = (nb: Notebook) => (
    <NotebookCard
      key={nb.id}
      notebook={nb}
      folder={folderOf(nb)}
      onOpen={handleOpenNotebook}
      onMove={setMoving}
      onDelete={setDeleting}
    />
  );

  // --- body --------------------------------------------------------------
  let body: ReactNode;
  if (accountEmpty) {
    body = (
      <EmptyState
        icon={<BookOpen />}
        title="Crea tu primer cuaderno"
        description="Un cuaderno reúne tus fuentes, un chat con IA y material de estudio sobre una materia."
        action={
          <Button leadingIcon={<Plus aria-hidden />} onClick={() => setNewNotebookOpen(true)}>
            Crear tu primer cuaderno
          </Button>
        }
      />
    );
  } else if (visible.length === 0 && query.trim()) {
    body = (
      <EmptyState
        icon={<SearchX />}
        title={`No hay cuadernos con «${query.trim()}»`}
        description="Revisa la ortografía o prueba con otra palabra."
        action={
          <Button variant="secondary" onClick={() => updateParams({q: ''})}>
            Limpiar búsqueda
          </Button>
        }
      />
    );
  } else if (visible.length === 0 && selectedFolder) {
    body = (
      <EmptyState
        icon={<FolderOpen />}
        title="Esta carpeta está vacía"
        description="Crea un cuaderno aquí o muévelo desde otra carpeta."
        action={
          <Button leadingIcon={<Plus aria-hidden />} onClick={() => setNewNotebookOpen(true)}>
            Crear cuaderno aquí
          </Button>
        }
      />
    );
  } else if (visible.length === 0) {
    body = (
      <EmptyState
        icon={<BookOpen />}
        title={selected === LOOSE_FILTER ? 'No hay cuadernos sin carpeta' : 'Todavía no hay cuadernos'}
        description="Crea un cuaderno para empezar a estudiar."
        action={
          <Button leadingIcon={<Plus aria-hidden />} onClick={() => setNewNotebookOpen(true)}>
            Nuevo cuaderno
          </Button>
        }
      />
    );
  } else if (selectedFolder) {
    body = (
      <>
        <FolderHeader
          folder={selectedFolder}
          notebookCount={visible.length}
          onNewNotebook={() => setNewNotebookOpen(true)}
          onDelete={() => setDeletingFolderId(selectedFolder.id)}
        />
        <NotebookGrid>{visible.map(renderCard)}</NotebookGrid>
      </>
    );
  } else {
    // Todos (grouped by folder, loose last) or Sin carpeta (single group).
    const groups = [
      ...(selected === LOOSE_FILTER ? [] : folders.map((f) => ({id: f.id, title: `${f.icon || '📁'} ${f.name}`, items: visible.filter((nb) => nb.folderId === f.id)}))),
      {id: LOOSE_FILTER, title: 'Sin carpeta', items: visible.filter((nb) => isLoose(nb, folders))},
    ].filter((g) => g.items.length > 0);
    body = (
      <>
        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`group-${g.id}`} className="flex flex-col gap-4">
            <h2 id={`group-${g.id}`} className="text-h2 text-strong">
              {g.title} <span className="text-small text-muted">{g.items.length}</span>
            </h2>
            <NotebookGrid>{g.items.map(renderCard)}</NotebookGrid>
          </section>
        ))}
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-6 pb-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 ref={headingRef} tabIndex={-1} className="text-h1 text-strong outline-none">
            Mis cuadernos
          </h1>
          <p className="mt-1 text-small text-muted">
            {countLabels.folders(folders.length)} · {countLabels.notebooks(notebooks.length)} ·{' '}
            {countLabels.sources(totalSources)}
          </p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Button variant="secondary" leadingIcon={<FolderPlus aria-hidden />} onClick={() => setNewFolderOpen(true)}>
            Nueva carpeta
          </Button>
          <Button leadingIcon={<Plus aria-hidden />} onClick={() => setNewNotebookOpen(true)}>
            Nuevo cuaderno
          </Button>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <Button fullWidth leadingIcon={<Plus aria-hidden />} onClick={() => setNewNotebookOpen(true)}>
            Nuevo cuaderno
          </Button>
          <Menu
            label="Más acciones"
            items={[{id: 'folder', label: 'Nueva carpeta', icon: <FolderPlus />, onSelect: () => setNewFolderOpen(true)}]}
          />
        </div>
      </header>

      {!accountEmpty ? (
        <>
          <div role="search" className="max-w-md">
            <TextField
              type="search"
              label="Buscar cuadernos"
              placeholder="Buscar por nombre, materia o carpeta"
              leadingIcon={<Search />}
              value={query}
              onChange={(e) => updateParams({q: e.target.value})}
              autoComplete="off"
            />
          </div>
          <p role="status" aria-live="polite" className={query.trim() ? 'text-small text-muted' : 'sr-only'}>
            {query.trim() ? `${countLabels.notebooks(visible.length)} encontrados` : ''}
          </p>
          <FolderFilter
            folders={folders}
            selected={selected}
            counts={counts}
            totalCount={searched.length}
            looseCount={looseCount}
            onSelect={(value) => updateParams({carpeta: value})}
          />
        </>
      ) : null}

      <div className="flex flex-col gap-8">{body}</div>

      {newNotebookOpen ? (
        <NewNotebookDialog
          folders={folders}
          initialFolderId={selectedFolder?.id ?? ''}
          onClose={() => setNewNotebookOpen(false)}
          onCreate={handleCreateNotebook}
        />
      ) : null}
      {newFolderOpen ? (
        <NewFolderDialog
          onClose={() => setNewFolderOpen(false)}
          onCreate={(name, icon, cover) => {
            handleCreateFolder(name, 'indigo', icon, cover);
            toast.show({message: 'Carpeta creada', variant: 'success'});
          }}
        />
      ) : null}
      {moving ? (
        <MoveNotebookDialog
          notebook={moving}
          folders={folders}
          onClose={() => setMoving(null)}
          onMove={(folderId) => moveNotebook(moving, folderId)}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={`¿Eliminar el cuaderno «${deleting?.title ?? ''}»?`}
        description="Se eliminarán sus fuentes, chats y materiales. Podrás deshacerlo durante unos segundos."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={Boolean(folderToDelete)}
        title={`¿Eliminar la carpeta «${folderToDelete?.name ?? ''}»?`}
        description={
          folderToDeleteCount > 0
            ? `Los ${countLabels.notebooks(folderToDeleteCount)} de la carpeta se conservan y pasan a «Sin carpeta».`
            : 'La carpeta está vacía. No se eliminará ningún cuaderno.'
        }
        confirmLabel="Eliminar carpeta"
        destructive
        onCancel={() => setDeletingFolderId(null)}
        onConfirm={confirmDeleteFolder}
      />
    </div>
  );
}
