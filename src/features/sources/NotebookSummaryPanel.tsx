import {useId, useState} from 'react';
import type {Notebook, SourceAnalysis} from '../../types';
import {Button, Card, InlineAlert, Skeleton} from '../../ui';
import {Icon} from '../../ui/Icon';
import {formatShortDate} from '../../utils/date';

const storageKey = (notebookId: string) => `mia_sources_summary_open_${notebookId}`;

function readStored(notebookId: string): boolean | null {
  try {
    const v = localStorage.getItem(storageKey(notebookId));
    return v === null ? null : v === '1';
  } catch {
    return null;
  }
}

interface NotebookSummaryPanelProps {
  notebook: Notebook;
  analyzing: boolean;
  error: boolean;
  onAnalyze: () => void;
}

function Group({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <div>
      <h4 className="border-b border-rule pb-1 font-mono text-caption uppercase tracking-widest text-muted">{title}</h4>
      <div className="mt-2 max-w-reading font-sans text-body text-default">{children}</div>
    </div>
  );
}

function List({items, ordered}: {items: string[]; ordered?: boolean}) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={`${ordered ? 'list-decimal' : 'list-disc'} pl-5`}>
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </Tag>
  );
}

/** Placeholder with the same two-column rhythm as `Summary`, shown while the analysis runs. */
function SummarySkeleton() {
  return (
    <div role="status" aria-busy="true" className="grid gap-4 sm:grid-cols-2">
      <span className="sr-only">Analizando tus fuentes…</span>
      {Array.from({length: 4}, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="w-full" />
          <Skeleton className="w-4/5" />
          {i % 2 === 0 ? <Skeleton className="w-3/5" /> : null}
        </div>
      ))}
    </div>
  );
}

function Summary({analysis}: {analysis: SourceAnalysis}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Group title="Tema">{analysis.mainTopic}</Group>
      <Group title="Subtemas">
        <List items={analysis.subtopics} />
      </Group>
      <Group title="Conceptos clave">
        <ul className="flex flex-col gap-1">
          {analysis.keyConcepts.map((c) => (
            <li key={c.term}>
              <span className="text-body-strong text-strong">{c.term}.</span> {c.definition}
            </li>
          ))}
        </ul>
      </Group>
      <Group title="Autores">
        {analysis.mentionedAuthors.length > 0 ? analysis.mentionedAuthors.join(', ') : 'No se identificaron autores.'}
      </Group>
      <Group title="Estructura">
        <List items={analysis.structure} ordered />
      </Group>
      <Group title="Puntos de evaluación">
        <List items={analysis.evaluationPoints} />
      </Group>
    </div>
  );
}

/** Collapsible "Resumen del cuaderno" panel. Collapsed by default; the choice is remembered. */
export function NotebookSummaryPanel({notebook, analyzing, error, onAnalyze}: NotebookSummaryPanelProps) {
  const bodyId = useId();
  const [open, setOpen] = useState(() => readStored(notebook.id) ?? false);
  const analysis = notebook.analysis;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(storageKey(notebook.id), next ? '1' : '0');
    } catch {
      /* preference only; ignoring is safe */
    }
  };

  return (
    <Card flush>
      <div className="flex flex-wrap items-center gap-2 p-3 sm:px-5">
        <Button
          variant="ghost"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={toggle}
          className="min-w-fit flex-1 !justify-start px-0 font-display text-h2"
          leadingIcon={
            <Icon
              name="chevron-down"
              className={`size-5 shrink-0 text-muted transition-transform duration-[120ms] ${open ? '' : '-rotate-90'}`}
            />
          }
        >
          Resumen del cuaderno
        </Button>
        <Button
          size="sm"
          variant={open || !analysis ? 'secondary' : 'ghost'}
          leadingIcon={<Icon name="refresh" className="size-4" />}
          loading={analyzing}
          onClick={onAnalyze}
        >
          {analysis ? 'Volver a analizar' : 'Analizar fuentes'}
        </Button>
      </div>
      {open ? (
        <div id={bodyId} className="flex flex-col gap-3 border-t border-hairline p-4 sm:px-5">
          {error ? (
            <InlineAlert
              variant="danger"
              live
              title="No se pudo analizar el cuaderno"
              actions={
                <Button size="sm" variant="secondary" onClick={onAnalyze}>
                  Reintentar
                </Button>
              }
            >
              Revisa tu conexión e inténtalo de nuevo.
            </InlineAlert>
          ) : null}
          {analyzing ? (
            <SummarySkeleton />
          ) : analysis ? (
            <>
              <Summary analysis={analysis} />
              <p className="font-mono text-caption text-muted">Analizado: {formatShortDate(analysis.analyzedAt)}</p>
            </>
          ) : (
            <p className="text-body text-muted">
              Todavía no hay un resumen. Se genera al analizar tus fuentes.
            </p>
          )}
        </div>
      ) : null}
    </Card>
  );
}
