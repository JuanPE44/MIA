import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {Layers} from 'lucide-react';
import {useAppState} from '../../app/AppStateContext';
import {paths} from '../../app/routes';
import type {ArtifactType, StudyArtifact} from '../../types';
import {ConfirmDialog, EmptyState, InlineAlert, useToast} from '../../ui';
import {FailedCard, GeneratingCard, MaterialCard} from './MaterialCard';
import {CreateMaterialSheet} from './CreateMaterialSheet';
import {useMaterialJobs} from './MaterialsJobs';
import {MATERIAL_TYPES} from './materialModel';
import {requestMaterialPrint} from './printMaterial';
import {TypeTile} from './TypeTile';

const NO_SOURCES_ID = 'materials-no-sources';

/** Materiales gallery (S6): create tiles first, then the cards. */
export function MaterialsScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const {activeNotebook, pendingArtifactType, setPendingArtifactType, handleDeleteArtifact} = useAppState();
  const {jobs, retry, dismiss} = useMaterialJobs();
  const [createType, setCreateType] = useState<ArtifactType | null>(null);
  const [deleting, setDeleting] = useState<StudyArtifact | null>(null);

  const sources = activeNotebook?.sources ?? [];

  useEffect(() => {
    if (!pendingArtifactType) return;
    setPendingArtifactType(null);
    if (sources.length === 0) return;
    setCreateType(pendingArtifactType);
  }, [pendingArtifactType, setPendingArtifactType, sources.length]);

  if (!activeNotebook) return null;

  const notebook = activeNotebook;
  const artifacts = notebook.artifacts;
  const noSources = sources.length === 0;
  const mine = jobs.filter((job) => job.notebookId === notebook.id);

  const open = (artifact: StudyArtifact, adjust = false) => {
    navigate(paths.artifact(notebook.id, artifact.id), {state: {fromMaterials: true, adjust}});
  };

  const confirmDelete = () => {
    if (!deleting) return;
    handleDeleteArtifact(deleting.id);
    setDeleting(null);
    // AppStateContext has no artifact undo. Toast only — do not invent a restore.
    toast.show({message: 'Material eliminado', variant: 'success'});
  };

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="crear-material" className="flex flex-col gap-4">
        <h2 id="crear-material" className="text-h2 text-strong">
          Crear material
        </h2>
        {noSources ? (
          <div id={NO_SOURCES_ID}>
            <InlineAlert
              variant="info"
              title="Añade al menos una fuente para crear materiales"
              actions={
                <Link
                  to={paths.notebookSegment(notebook.id, 'FUENTES')}
                  className="inline-flex min-h-11 items-center text-label text-primary-text underline-offset-2 hover:underline"
                >
                  Añadir fuente
                </Link>
              }
            >
              Los tipos quedan desactivados hasta que el cuaderno tenga una fuente.
            </InlineAlert>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {MATERIAL_TYPES.map((info) => (
            <TypeTile
              key={info.id}
              info={info}
              disabled={noSources}
              describedBy={NO_SOURCES_ID}
              onSelect={setCreateType}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="tus-materiales" className="flex flex-col gap-4">
        <h2 id="tus-materiales" className="text-h2 text-strong">
          Tus materiales ({artifacts.length})
        </h2>
        {artifacts.length === 0 && mine.length === 0 ? (
          <EmptyState
            headingLevel={3}
            icon={<Layers />}
            title="Todavía no creaste materiales"
            description="Elige un tipo arriba para generar el primero a partir de tus fuentes."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mine.map((job) => (
              <li key={job.id}>
                {job.status === 'error' ? (
                  <FailedCard job={job} onRetry={() => retry(job.id)} onDismiss={() => dismiss(job.id)} />
                ) : (
                  <GeneratingCard job={job} />
                )}
              </li>
            ))}
            {artifacts.map((artifact) => (
              <li key={artifact.id}>
                <MaterialCard
                  notebookId={notebook.id}
                  artifact={artifact}
                  onOpen={(item) => open(item)}
                  onAdjust={(item) => open(item, true)}
                  onPrint={(item) => requestMaterialPrint(item, notebook.title)}
                  onDelete={setDeleting}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <CreateMaterialSheet
        type={createType}
        notebookId={notebook.id}
        notebookTitle={notebook.title}
        sources={sources}
        onClose={() => setCreateType(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={deleting ? `¿Eliminar «${deleting.title}»?` : '¿Eliminar el material?'}
        description="No se puede deshacer."
      />
    </div>
  );
}
