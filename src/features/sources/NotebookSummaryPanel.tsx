import {useId, useState} from 'react';
import type {Notebook, SourceAnalysis} from '../../types';
import {Button, Card, InlineAlert, SimulatedBadge} from '../../ui';
import {Icon} from '../../ui/Icon';

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
      <h4 className="text-label text-muted">{title}</h4>
      <div className="mt-1 text-body text-default">{children}</div>
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

/** Collapsible "Resumen del cuaderno" panel. Open by default with <= 3 sources; the choice is remembered. */
export function NotebookSummaryPanel({notebook, analyzing, error, onAnalyze}: NotebookSummaryPanelProps) {
  const bodyId = useId();
  const [open, setOpen] = useState(() => readStored(notebook.id) ?? notebook.sources.length <= 3);
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
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={toggle}
          className="inline-flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-control text-left text-h3 text-strong"
        >
          <Icon name="chevron-down"
            className={`size-5 shrink-0 text-muted transition-transform duration-[120ms] ${open ? '' : '-rotate-90'}`}
          />
          Resumen del cuaderno
        </button>
        {analysis ? <SimulatedBadge /> : null}
        <Button
          size="sm"
          variant="secondary"
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
          {analysis ? (
            <>
              <Summary analysis={analysis} />
              <p className="text-small text-muted">Analizado: {analysis.analyzedAt}</p>
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
