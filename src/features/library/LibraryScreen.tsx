import {useMemo, useRef, useState, type ReactNode} from 'react';
import {useSearchParams} from 'react-router';
import {useAppState} from '../../app/AppStateContext';
import type {Notebook} from '../../types';
import {Button, ConfirmDialog, EmptyState, Highlight, Menu, Page, PageHeader, TextField, useToast} from '../../ui';
import {ChangeCoverDialog} from './ChangeCoverDialog';
import {FolderFilter} from './FolderFilter';
import {FolderHeader} from './FolderHeader';
import {MoveNotebookDialog} from './MoveNotebookDialog';
import {NewFolderDialog} from './NewFolderDialog';
import {NewNotebookDialog} from './NewNotebookDialog';
import {NotebookCard} from './NotebookCard';
import {NotebookGrid} from './NotebookGrid';
import {LOOSE_FILTER, countLabels, isLoose, matchesQuery} from './libraryModel';
import {Icon} from '../../ui/Icon';

/** "Mis cuadernos" (S2): folders + notebooks, search, filter, create/move/delete with undo. */
export function LibraryScreen() {
  const {
    folders,
    notebooks,
    handleOpenNotebook,
    handleCreateNotebook,
    handleCreateSampleNotebook,
    handleDeleteNotebook,
    handleRestoreNotebook,
    handleMoveNotebook,
    handleCreateFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    isNotebookLimitReached,
  } = useAppState();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [newNotebookOpen, setNewNotebookOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [moving, setMoving] = useState<Notebook | null>(null);
  const [deleting, setDeleting] = useState<Notebook | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [coverFolderId, setCoverFolderId] = useState<string | null>(null);
  const [newNotebookFolderId, setNewNotebookFolderId] = useState('');

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
    if (previous !== folderId && isNotebookLimitReached(folderId)) {
      handleMoveNotebook(nb.id, folderId); // shows the plan-limit toast and does not move
      return;
    }
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

  const openNewNotebook = (folderId = '') => {
    setNewNotebookFolderId(folderId);
    setNewNotebookOpen(true);
  };

  const folderToDelete = folders.find((f) => f.id === deletingFolderId);
  const folderToDeleteCount = notebooks.filter((nb) => nb.folderId === deletingFolderId).length;

  const renderCard = (nb: Notebook, inGroup = false) => (
    <NotebookCard
      key={nb.id}
      notebook={nb}
      folder={folderOf(nb)}
      showFolder={!inGroup}
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
        icon={<Icon name="book" />}
        title="Crea tu primer cuaderno"
        description="Un cuaderno reúne tus fuentes, un chat con IA y material de estudio sobre una materia."
        action={
          <Button variant="primary" leadingIcon={<Icon name="add" />} onClick={() => openNewNotebook(selectedFolder?.id ?? '')}>
            Crear tu primer cuaderno
          </Button>
        }
        secondaryAction={
          <Button variant="ghost" leadingIcon={<Icon name="sparkles" />} onClick={handleCreateSampleNotebook}>
            Probar cuaderno de ejemplo
          </Button>
        }
      />
    );
  } else if (visible.length === 0 && query.trim()) {
    body = (
      <EmptyState
        icon={<Icon name="search-empty" />}
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
        icon={<Icon name="folder-open" />}
        title="Esta carpeta está vacía"
        description="Crea un cuaderno aquí o muévelo desde otra carpeta."
        action={
          <Button variant="primary" leadingIcon={<Icon name="add" />} onClick={() => openNewNotebook(selectedFolder?.id ?? '')}>
            Crear cuaderno aquí
          </Button>
        }
      />
    );
  } else if (visible.length === 0 && (selected === LOOSE_FILTER || folders.length === 0)) {
    body = (
      <EmptyState
        icon={<Icon name="book" />}
        title={selected === LOOSE_FILTER ? 'No hay cuadernos sin carpeta' : 'Todavía no hay cuadernos'}
        description="Crea un cuaderno para empezar a estudiar."
        action={
          <Button variant="primary" leadingIcon={<Icon name="add" />} onClick={() => openNewNotebook(selectedFolder?.id ?? '')}>
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
          onNewNotebook={() => openNewNotebook(selectedFolder.id)}
          onDelete={() => setDeletingFolderId(selectedFolder.id)}
          onChangeCover={() => setCoverFolderId(selectedFolder.id)}
        />
        <NotebookGrid>{visible.map((nb) => renderCard(nb, true))}</NotebookGrid>
      </>
    );
  } else {
    // Todos (banner per folder, loose last) or Sin carpeta (single group).
    const searching = Boolean(query.trim());
    const folderGroups =
      selected === LOOSE_FILTER
        ? []
        : folders
            .map((f) => ({folder: f, items: visible.filter((nb) => nb.folderId === f.id)}))
            // Empty folders stay visible in "Todas", except while searching.
            .filter((g) => g.items.length > 0 || !searching);
    const looseItems = visible.filter((nb) => isLoose(nb, folders));
    body = (
      <>
        {folderGroups.map(({folder, items}) =>
          searching ? (
            <section key={folder.id} aria-labelledby={`group-${folder.id}`} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 border-b border-rule pb-2">
                <span className="font-mono text-caption uppercase tracking-widest text-muted">Carpeta</span>
                <h2 id={`group-${folder.id}`} className="flex items-center gap-2 font-display text-h2 text-strong">
                  <Icon name="folder-open" weight="duotone" className="size-6 shrink-0 text-ink" />
                  <span className="min-w-0 truncate">{folder.name}</span>
                  <span className="font-mono text-small font-normal text-muted">{countLabels.notebooks(items.length)}</span>
                </h2>
              </div>
              <NotebookGrid>{items.map((nb) => renderCard(nb, true))}</NotebookGrid>
            </section>
          ) : (
            <div key={folder.id} className="flex flex-col gap-4">
              <FolderHeader
                folder={folder}
                notebookCount={items.length}
                onOpen={() => updateParams({carpeta: folder.id})}
                onNewNotebook={() => openNewNotebook(folder.id)}
                onDelete={() => setDeletingFolderId(folder.id)}
                onChangeCover={() => setCoverFolderId(folder.id)}
              />
              {items.length > 0 ? (
                <NotebookGrid>{items.map((nb) => renderCard(nb, true))}</NotebookGrid>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-rule px-4 py-6 text-center">
                  <p className="text-small text-muted">Esta carpeta está vacía.</p>
                  <Button variant="secondary" leadingIcon={<Icon name="add" />} onClick={() => openNewNotebook(folder.id)}>
                    Crear el primer cuaderno
                  </Button>
                </div>
              )}
            </div>
          ),
        )}
        {looseItems.length > 0 ? (
          <section aria-labelledby={`group-${LOOSE_FILTER}`} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 border-b border-rule pb-2">
              <span className="font-mono text-caption uppercase tracking-widest text-muted">Carpeta</span>
              <h2 id={`group-${LOOSE_FILTER}`} className="flex items-center gap-2 font-display text-h2 text-strong">
                <Icon name="folder-open" weight="duotone" className="size-6 shrink-0 text-ink" />
                <span className="min-w-0 truncate">Sin carpeta</span>
                <span className="font-mono text-small font-normal text-muted">{countLabels.notebooks(looseItems.length)}</span>
              </h2>
            </div>
            <NotebookGrid>{looseItems.map((nb) => renderCard(nb, false))}</NotebookGrid>
          </section>
        ) : null}
      </>
    );
  }

  return (
    <Page className="flex flex-col gap-6 pb-16">
      <PageHeader
        headingRef={headingRef}
        title={
          <>
            Mis <Highlight trigger="mount">cuadernos</Highlight>
          </>
        }
        actions={
          <div className="flex items-center gap-2 sm:hidden">
            <Button variant="primary" fullWidth leadingIcon={<Icon name="add" />} onClick={() => openNewNotebook(selectedFolder?.id ?? '')}>
              Nuevo cuaderno
            </Button>
            <Menu
              label="Más acciones"
              items={[{id: 'folder', label: 'Nueva carpeta', icon: <Icon name="folder-add" />, onSelect: () => setNewFolderOpen(true)}]}
            />
          </div>
        }
      />

      {!accountEmpty ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div role="search" className="w-full min-w-0 max-w-narrow sm:flex-1 [&_label]:sr-only">
              <TextField
                type="search"
                label="Buscar cuadernos"
                placeholder="Buscar cuadernos"
                leadingIcon={<Icon name="search" />}
                value={query}
                onChange={(e) => updateParams({q: e.target.value})}
                autoComplete="off"
              />
            </div>
            <div className="hidden items-center gap-2 sm:ml-auto sm:flex">
              <Button variant="ghost" leadingIcon={<Icon name="folder-add" />} onClick={() => setNewFolderOpen(true)}>
                Nueva carpeta
              </Button>
              <Button variant="primary" leadingIcon={<Icon name="add" />} onClick={() => openNewNotebook(selectedFolder?.id ?? '')}>
                Nuevo cuaderno
              </Button>
            </div>
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
          initialFolderId={newNotebookFolderId}
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
      {coverFolderId && folders.some((f) => f.id === coverFolderId) ? (
        <ChangeCoverDialog
          folderName={folders.find((f) => f.id === coverFolderId)!.name}
          initialCover={folders.find((f) => f.id === coverFolderId)!.coverImage}
          onClose={() => setCoverFolderId(null)}
          onSave={(cover) => {
            handleUpdateFolder(coverFolderId, {coverImage: cover});
            toast.show({message: 'Portada actualizada', variant: 'success'});
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
    </Page>
  );
}
