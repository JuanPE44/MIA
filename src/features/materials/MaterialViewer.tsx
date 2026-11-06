import {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router';
import {ChevronLeft, Copy, Printer, SlidersHorizontal, ZoomIn, ZoomOut} from 'lucide-react';
import {useAppState} from '../../app/AppStateContext';
import {paths} from '../../app/routes';
import type {StudyArtifact} from '../../types';
import {Button, Dialog, IconButton, Menu, SegmentedControl, SimulatedBadge, Textarea, useToast} from '../../ui';
import {useIsPhone} from '../../ui/internal/useIsPhone';
import {hasInteractiveMode} from './materialModel';
import {refineMaterial} from './materialsApi';
import {requestMaterialPrint} from './printMaterial';
import {FlashcardsView} from './renderers/FlashcardsView';
import {InfographicView} from './renderers/InfographicView';
import {PodcastView} from './renderers/PodcastView';
import {QuizView} from './renderers/QuizView';
import {ReadingPage} from './renderers/ReadingPage';

type ViewMode = 'lectura' | 'interactivo';

interface ViewerState {
  fromMaterials?: boolean;
  adjust?: boolean;
}

const ZOOM_MIN = 70;
const ZOOM_MAX = 140;

function readState(state: unknown): ViewerState {
  if (!state || typeof state !== 'object') return {};
  const value = state as ViewerState;
  return {fromMaterials: Boolean(value.fromMaterials), adjust: Boolean(value.adjust)};
}

function InteractiveBody({artifact, notebookTitle}: {artifact: StudyArtifact; notebookTitle: string}) {
  const data = artifact.structuredData;
  const reading = <ReadingPage artifact={artifact} notebookTitle={notebookTitle} />;
  switch (artifact.type) {
    case 'cuestionario':
      return Array.isArray(data) ? <QuizView questions={data} /> : reading;
    case 'flashcards':
      return Array.isArray(data) ? <FlashcardsView cards={data} /> : reading;
    case 'audio_podcast':
      return Array.isArray(data) ? <PodcastView lines={data} /> : reading;
    case 'infografia':
      return data && typeof data === 'object' && !Array.isArray(data) ? <InfographicView data={data} /> : reading;
    default:
      return reading;
  }
}

/** Fullscreen material viewer (S6b). Notebook chrome stays hidden by the route branch in App. */
export function MaterialViewer() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = useIsPhone();
  const toast = useToast();
  const {route, activeNotebook, handleUpdateArtifact} = useAppState();

  const artifactId = route.kind === 'workspace' ? route.artifactId : undefined;
  const artifact = activeNotebook?.artifacts.find((item) => item.id === artifactId) ?? null;

  const [mode, setMode] = useState<ViewMode>('lectura');
  const [zoom, setZoom] = useState(100);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    setMode('lectura');
    setZoom(100);
    setComment('');
  }, [artifact?.id]);

  useEffect(() => {
    const state = readState(location.state);
    if (!state.adjust || !artifact || !activeNotebook) return;
    setAdjustOpen(true);
    navigate(paths.artifact(activeNotebook.id, artifact.id), {
      replace: true,
      state: {fromMaterials: state.fromMaterials},
    });
  }, [location.state, artifact, activeNotebook, navigate]);

  const closeViewer = () => {
    const state = readState(location.state);
    if (state.fromMaterials) {
      navigate(-1);
      return;
    }
    if (activeNotebook) navigate(paths.notebookSegment(activeNotebook.id, 'ARTEFACTOS'));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (document.querySelector('dialog[open]')) return;
      closeViewer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // closeViewer reads the latest location via the effect re-subscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, activeNotebook?.id]);

  if (!activeNotebook || !artifact) return null;

  const notebook = activeNotebook;
  const interactive = hasInteractiveMode(artifact);
  const showInteractive = mode === 'interactivo' && interactive;
  const scale = zoom / 100;

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(artifact.summaryText);
      toast.show({message: 'Texto copiado', variant: 'success'});
    } catch {
      toast.show({message: 'No se pudo copiar', variant: 'danger'});
    }
  };

  const print = () => requestMaterialPrint(artifact, notebook.title);

  const submitAdjust = async () => {
    const note = comment.trim();
    if (!note || refining) return;
    const previous = artifact;
    setRefining(true);
    try {
      const updatedContent = await refineMaterial(previous, note, notebook.sources);
      handleUpdateArtifact({
        ...previous,
        summaryText: updatedContent,
        feedback: {
          ...previous.feedback,
          comments: [...(previous.feedback?.comments ?? []), note],
        },
      });
      setComment('');
      setAdjustOpen(false);
      toast.show({
        message: 'Material actualizado',
        variant: 'success',
        action: {label: 'Deshacer', onAction: () => handleUpdateArtifact(previous)},
      });
    } catch {
      toast.show({message: 'No se pudo actualizar el material', variant: 'danger'});
    } finally {
      setRefining(false);
    }
  };

  const overflow = (
    <Menu
      label="Más acciones del material"
      items={[
        {id: 'copy', label: 'Copiar', icon: <Copy aria-hidden />, onSelect: () => void copyText()},
        {id: 'print', label: 'Imprimir / PDF', icon: <Printer aria-hidden />, onSelect: print},
        {id: 'adjust', label: 'Ajustar material', icon: <SlidersHorizontal aria-hidden />, onSelect: () => setAdjustOpen(true)},
      ]}
    />
  );

  return (
    <div className="flex min-h-dvh flex-col bg-page text-strong">
      <header className="flex min-h-14 flex-wrap items-center gap-2 border-b border-hairline bg-surface px-2 sm:px-4">
        <IconButton aria-label="Volver a materiales" icon={<ChevronLeft aria-hidden className="size-5" />} onClick={closeViewer} />
        <h1 className="min-w-0 flex-1 truncate text-h3 text-strong">{artifact.title}</h1>
        <SimulatedBadge />
        {interactive ? (
          <SegmentedControl
            aria-label="Modo de lectura"
            value={mode}
            onValueChange={setMode}
            options={[
              {value: 'lectura', label: 'Lectura'},
              {value: 'interactivo', label: 'Interactivo'},
            ]}
          />
        ) : null}
        <div className="flex items-center rounded-control border border-hairline">
          <IconButton
            aria-label="Reducir zoom"
            icon={<ZoomOut aria-hidden className="size-4" />}
            size="sm"
            disabled={zoom <= ZOOM_MIN}
            onClick={() => setZoom((value) => Math.max(ZOOM_MIN, value - 10))}
          />
          <span aria-live="polite" className="min-w-12 text-center text-caption tabular-nums text-muted">
            {zoom}%
          </span>
          <IconButton
            aria-label="Aumentar zoom"
            icon={<ZoomIn aria-hidden className="size-4" />}
            size="sm"
            disabled={zoom >= ZOOM_MAX}
            onClick={() => setZoom((value) => Math.min(ZOOM_MAX, value + 10))}
          />
        </div>
        {phone ? (
          overflow
        ) : (
          <>
            <Button variant="ghost" size="sm" leadingIcon={<Copy aria-hidden className="size-4" />} onClick={() => void copyText()}>
              Copiar
            </Button>
            <Button variant="ghost" size="sm" leadingIcon={<Printer aria-hidden className="size-4" />} onClick={print}>
              Imprimir / PDF
            </Button>
            <Button variant="secondary" size="sm" leadingIcon={<SlidersHorizontal aria-hidden className="size-4" />} onClick={() => setAdjustOpen(true)}>
              Ajustar material
            </Button>
          </>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-auto bg-page px-4 py-6">
        <div style={{transform: `scale(${scale})`, transformOrigin: 'top center', width: `${100 / scale}%`}}>
          {showInteractive ? (
            <InteractiveBody artifact={artifact} notebookTitle={notebook.title} />
          ) : (
            <ReadingPage artifact={artifact} notebookTitle={notebook.title} />
          )}
        </div>
      </div>

      <Dialog
        open={adjustOpen}
        onClose={() => {
          if (!refining) setAdjustOpen(false);
        }}
        size="md"
        title="Ajustar material"
        description="El texto se actualiza con tu comentario. Puedes deshacerlo después."
        dismissible={!refining}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustOpen(false)} disabled={refining}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => void submitAdjust()}
              loading={refining}
              disabled={!comment.trim()}
              disabledReason={!comment.trim() ? 'Escribe qué quieres cambiar' : undefined}
            >
              Ajustar
            </Button>
          </>
        }
      >
        <Textarea
          label="¿Qué quieres cambiar?"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          minRows={4}
        />
      </Dialog>
    </div>
  );
}
