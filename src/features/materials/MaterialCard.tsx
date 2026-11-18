import {useEffect, useRef, useState, type MouseEvent} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import type {StudyArtifact} from '../../types';
import {Button, Card, InteractiveCard, Menu, Skeleton, type MenuItem} from '../../ui';
import {paths} from '../../app/routes';
import {formatMaterialDate, materialTypeOf, plural} from './materialModel';
import type {MaterialJob} from './MaterialsJobs';
import {Icon} from '../../ui/Icon';

interface MaterialCardProps {
  notebookId: string;
  artifact: StudyArtifact;
  onOpen: (artifact: StudyArtifact) => void;
  onAdjust: (artifact: StudyArtifact) => void;
  onPrint: (artifact: StudyArtifact) => void;
  onDelete: (artifact: StudyArtifact) => void;
}

export function MaterialCard({notebookId, artifact, onOpen, onAdjust, onPrint, onDelete}: MaterialCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const info = materialTypeOf(artifact.type);
  const sources = artifact.citations?.length || 1;

  // A real link (middle/ctrl-click keep native behavior); plain clicks navigate client-side.
  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onOpen(artifact);
  };

  const items: MenuItem[] = [
    {id: 'open', label: 'Abrir', icon: <Icon name="external" />, onSelect: () => onOpen(artifact)},
    {id: 'adjust', label: 'Ajustar material', icon: <Icon name="adjust" />, onSelect: () => onAdjust(artifact)},
    {id: 'print', label: 'Imprimir / PDF', icon: <Icon name="print" />, onSelect: () => onPrint(artifact)},
    {id: 'delete', label: 'Eliminar', icon: <Icon name="delete" />, danger: true, onSelect: () => onDelete(artifact)},
  ];

  return (
    <div ref={wrapperRef} className="group/stack relative isolate h-full pb-2 pr-3">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 right-2 -z-10 translate-x-2 translate-y-2 rotate-1 rounded-card border border-rule bg-subtle transition-transform duration-[120ms] group-hover/stack:rotate-2 motion-reduce:transition-none"
      />
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 right-2 -z-10 translate-x-1 translate-y-1 -rotate-1 rounded-card border border-rule bg-surface transition-transform duration-[120ms] group-hover/stack:-rotate-2 motion-reduce:transition-none"
      />
      <InteractiveCard
        className="h-full"
        href={paths.artifact(notebookId, artifact.id)}
        onClick={handleClick}
        title={
          <span className="flex items-center gap-3 pr-10">
            <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-control border border-rule text-strong" style={{backgroundImage: info.gradient}}>
              <Icon name={info.icon} weight="duotone" className="size-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-mono text-caption uppercase tracking-widest text-muted">{info.label}</span>
              <span className="line-clamp-2 break-words">{artifact.title}</span>
            </span>
          </span>
        }
        actions={<Menu label={`Más opciones de ${artifact.title}`} items={items} contextTargetRef={wrapperRef} />}
      >
        <p className="font-mono text-caption text-muted">
          {formatMaterialDate(artifact.createdAt)} · {plural(sources, 'fuente', 'fuentes')}
        </p>
      </InteractiveCard>
    </div>
  );
}

const STAGE_INTERVAL_MS = 2600;

/** Staged copy shown while a material generates; the last stage holds until it finishes. */
function stagesFor(noun: string): string[] {
  return ['Leyendo tus fuentes…', 'Extrayendo conceptos clave…', `Armando: ${noun}…`, 'Dando los últimos retoques…'];
}

/** Card shown while a material is generating in the background: staged text + slim progress bar. */
export function GeneratingCard({job}: {job: MaterialJob}) {
  const info = materialTypeOf(job.type);
  const reduced = useReducedMotion();
  const stages = stagesFor(info.noun);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setStage((s) => Math.min(s + 1, stages.length - 1)), STAGE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [stages.length]);

  // Each stage advances the bar; it never reaches 100% until the card is replaced by the result.
  const pct = Math.round(((stage + 1) / (stages.length + 0.5)) * 100);

  return (
    <Card aria-busy="true" className="h-full">
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-control border border-rule text-strong" style={{backgroundImage: info.gradient}}>
          <Icon name={info.icon} weight="duotone" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-caption uppercase tracking-widest text-muted">{info.label}</p>
          <p role="status" aria-live="polite" className="relative h-6 text-h3 text-strong">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={stage}
                className="block truncate"
                initial={reduced ? false : {opacity: 0, y: 6}}
                animate={{opacity: 1, y: 0}}
                exit={reduced ? {opacity: 0, transition: {duration: 0}} : {opacity: 0, y: -6}}
                transition={{duration: 0.18}}
              >
                {stages[stage]}
              </motion.span>
            </AnimatePresence>
          </p>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label={`Progreso de ${info.noun}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-4 h-1.5 w-full overflow-hidden rounded-pill border border-rule bg-subtle"
      >
        <div className="h-full rounded-pill bg-primary transition-[width] duration-700 ease-out" style={{width: `${pct}%`}} />
      </div>
      <div aria-hidden className="mt-4 space-y-2">
        <Skeleton className="w-4/5" />
        <Skeleton className="w-3/5" />
      </div>
      <p className="mt-3 text-small text-muted">Puedes seguir usando la app; te avisamos cuando esté listo.</p>
    </Card>
  );
}

/** Card error state with Reintentar. */
export function FailedCard({job, onRetry, onDismiss}: {job: MaterialJob; onRetry: () => void; onDismiss: () => void}) {
  const info = materialTypeOf(job.type);
  return (
    <Card className="h-full border-danger/30 bg-danger-tint">
      <div role="alert" className="flex items-start gap-3">
        <Icon name="error" className="mt-0.5 size-5 shrink-0 text-danger" />
        <div className="min-w-0">
          <p className="text-body-strong text-strong">No se pudo crear: {info.label.toLowerCase()}</p>
          <p className="text-small text-default">Revisa tu conexión e inténtalo de nuevo.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Descartar
        </Button>
      </div>
    </Card>
  );
}
