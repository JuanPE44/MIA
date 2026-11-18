import {apiFetch} from '../../services/api';
import {useState} from 'react';
import {useAppState} from '../../app/AppStateContext';
import type {SourceItem} from '../../types';
import {Button, Card, ConfirmDialog, EmptyState, InlineAlert, Menu, Reveal, useToast} from '../../ui';
import {AnalysisDialog} from './AnalysisDialog';
import {NotebookSummaryPanel} from './NotebookSummaryPanel';
import {SourceRow, type SourceStatus} from './SourceRow';
import {Icon} from '../../ui/Icon';

/** Fuentes (S5): list of sources with grounding switches, status and notebook summary. */
export function SourcesScreen() {
  const {
    activeNotebook,
    analyzingSourceIds,
    failedSourceIds,
    persistenceError,
    openAddSource,
    handleDeleteSource,
    handleToggleSourceForChat,
    handleSelectAllSourcesForChat,
    handleSetAnalysis,
    handleRetrySourceAnalysis,
    setChatInitialPrompt,
    setPendingArtifactType,
    goToSegment,
  } = useAppState();
  const toast = useToast();
  const [viewing, setViewing] = useState<SourceItem | null>(null);
  const [deleting, setDeleting] = useState<SourceItem | null>(null);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryError, setSummaryError] = useState(false);

  if (!activeNotebook) return null;
  const notebook = activeNotebook;
  const sources = notebook.sources;
  const total = sources.length;
  const active = sources.filter((s) => s.selectedForChat !== false).length;

  const statusOf = (s: SourceItem): SourceStatus => {
    if (analyzingSourceIds.includes(s.id)) return 'analyzing';
    // Persisted "analyzing" with no live request means the session was interrupted.
    if (failedSourceIds.includes(s.id) || s.isAnalyzing) return 'error';
    return 'ready';
  };

  const ask = (source: SourceItem) => {
    setChatInitialPrompt(
      `¿Qué aspectos centrales, definiciones, autores y conclusiones específicas se detallan en la fuente "${source.title}"?`,
    );
    setViewing(null);
    goToSegment('CHAT');
  };

  const analyzeNotebook = async () => {
    if (total === 0) return;
    setSummaryBusy(true);
    setSummaryError(false);
    try {
      const res = await apiFetch('/api/analyze-sources', {
        method: 'POST',
        body: JSON.stringify({sources, notebookTitle: notebook.title}),
      });
      if (!res.ok) throw new Error(`analyze failed: ${res.status}`);
      const data = await res.json();
      if (!data.analysis) throw new Error('empty analysis');
      handleSetAnalysis(data.analysis);
    } catch {
      setSummaryError(true);
    } finally {
      setSummaryBusy(false);
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const title = deleting.title;
    handleDeleteSource(deleting.id);
    setDeleting(null);
    toast.show({variant: 'success', message: `Fuente «${title}» eliminada`});
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h2 text-strong">Fuentes ({total})</h2>
        {total > 0 ? (
          <Button variant="primary" leadingIcon={<Icon name="add" className="size-5" />} onClick={openAddSource}>
            Añadir fuente
          </Button>
        ) : null}
      </div>

      {persistenceError ? (
        <InlineAlert variant="danger" live>
          No se pudo guardar en este navegador. Libera espacio eliminando fuentes grandes.
        </InlineAlert>
      ) : null}

      {total === 0 ? (
        <Card>
          <EmptyState
            icon={<Icon name="document-add" />}
            title="Añade tu primera fuente"
            description="Puedes subir PDF, imágenes, audio o video, pegar un texto, guardar un enlace o buscar en la web. El chat responde con lo que hay en tus fuentes."
            action={
              <Button variant="primary" leadingIcon={<Icon name="add" className="size-5" />} onClick={openAddSource}>
                Añadir fuente
              </Button>
            }
            headingLevel={3}
          />
        </Card>
      ) : (
        <>
          <NotebookSummaryPanel
            key={notebook.id}
            notebook={notebook}
            analyzing={summaryBusy}
            error={summaryError}
            onAnalyze={analyzeNotebook}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-label text-strong">Usar en el chat:</span>
              <div className="hidden gap-2 sm:flex">
                <Button size="sm" variant="secondary" onClick={() => handleSelectAllSourcesForChat(true)}>
                  Todas
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleSelectAllSourcesForChat(false)}>
                  Ninguna
                </Button>
              </div>
              <div className="sm:hidden">
                <Menu
                  label="Elegir fuentes para el chat"
                  items={[
                    {id: 'all', label: 'Todas', onSelect: () => handleSelectAllSourcesForChat(true)},
                    {id: 'none', label: 'Ninguna', onSelect: () => handleSelectAllSourcesForChat(false)},
                  ]}
                  renderTrigger={(props) => (
                    <Button
                      {...props}
                      size="sm"
                      variant="secondary"
                      trailingIcon={<Icon name="chevron-down" className="size-4" />}
                    >
                      Elegir
                    </Button>
                  )}
                />
              </div>
            </div>
            <p role="status" aria-live="polite" className="text-label text-muted">
              {active} de {total} {total === 1 ? 'activa' : 'activas'}
            </p>
          </div>

          <Reveal as="ul" className="flex flex-col gap-3">
              {sources.map((s) => (
                <SourceRow
                  key={s.id}
                  source={s}
                  status={statusOf(s)}
                  onToggle={() => handleToggleSourceForChat(s.id)}
                  onViewAnalysis={() => setViewing(s)}
                  onAsk={() => ask(s)}
                  onDelete={() => setDeleting(s)}
                  onRetry={() => handleRetrySourceAnalysis(s.id)}
                />
              ))}
          </Reveal>

          <section aria-labelledby="sources-next" className="flex flex-col gap-3">
            <h3 id="sources-next" className="text-h3 text-strong">
              Siguiente paso
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:max-sm:w-full">
              <Button
                variant="primary"
                onClick={() => {
                  setPendingArtifactType('resumen');
                  goToSegment('ARTEFACTOS');
                }}
              >
                Crear resumen
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setPendingArtifactType('cuestionario');
                  goToSegment('ARTEFACTOS');
                }}
              >
                Crear otro material
              </Button>
              <Button
                variant="secondary"
                leadingIcon={<Icon name="chat" className="size-5" />}
                onClick={() => goToSegment('CHAT')}
              >
                Preguntar en el chat
              </Button>
            </div>
          </section>
        </>
      )}

      <AnalysisDialog source={viewing} onClose={() => setViewing(null)} onAsk={ask} />
      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={deleting ? `¿Eliminar la fuente «${deleting.title}»?` : ''}
        description="Se quitará de este cuaderno y el chat dejará de usarla. No se puede deshacer."
      />
    </div>
  );
}
