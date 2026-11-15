import type {StudyArtifact} from '../../../types';
import {
  FORMAT_OPTIONS,
  LENGTH_OPTIONS,
  MARK_TEXT_COLOR,
  QUALITY_OPTIONS,
  highlightColorOf,
  materialTypeOf,
} from '../materialModel';
import {DocumentText} from './DocumentText';
import {Icon} from '../../../ui/Icon';

interface ReadingPageProps {
  artifact: StudyArtifact;
  notebookTitle: string;
}

const labelOf = (options: Array<{value: string; label: string}>, value?: string) =>
  options.find((o) => o.value === value)?.label;

/**
 * "Lectura" mode: a paper-like page. Used by every type; for document types
 * (resumen, guía, modelo de examen, presentación) it is the whole material, for
 * quiz / flashcards it also prints the questions or cards as an annex.
 */
export function ReadingPage({artifact, notebookTitle}: ReadingPageProps) {
  const p = artifact.personalization;
  const info = materialTypeOf(artifact.type);
  const color = highlightColorOf(p?.authorHighlightColor);
  const data = Array.isArray(artifact.structuredData) ? artifact.structuredData : null;

  return (
    <article className="w-full max-w-reading rounded-card border border-rule bg-surface p-5 shadow-elevation-1 sm:p-12 print:max-w-none print:border-0 print:p-0 print:shadow-none">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3 font-mono text-caption text-muted">
          <span>Cuaderno: {notebookTitle}</span>
          <span>Basado en tus fuentes · {artifact.createdAt}</span>
        </div>

        <div className="mt-6">
          <span className="inline-flex h-6 items-center rounded-small bg-highlight px-2 font-mono text-caption uppercase tracking-widest text-highlight-ink">
            {info.label}
          </span>
          {/* The toolbar already carries the title as h1; this copy is the full, non-truncated one. */}
          <p aria-hidden className="mt-2 font-display text-h1 text-strong">
            {artifact.title}
          </p>
          <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule pt-2 text-small text-muted">
            <div className="flex gap-1">
              <dt className="font-semibold">Calidad:</dt>
              <dd>{labelOf(QUALITY_OPTIONS, p?.quality) ?? 'Alto'}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-semibold">Extensión:</dt>
              <dd>{labelOf(LENGTH_OPTIONS, p?.length) ?? 'Intermedio'}</dd>
            </div>
            {p?.format ? (
              <div className="flex gap-1">
                <dt className="font-semibold">Formato:</dt>
                <dd>{labelOf(FORMAT_OPTIONS, p.format)}</dd>
              </div>
            ) : null}
            {p?.highlightAuthors ? (
              <div className="flex items-center gap-1">
                <dt className="font-semibold">Autores resaltados:</dt>
                <dd>
                  <mark
                    className="rounded-small px-1.5 py-0.5 text-caption font-semibold"
                    style={{backgroundColor: color.bg, color: MARK_TEXT_COLOR}}
                  >
                    Referentes teóricos
                  </mark>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </header>

      <div className="my-6">
        <DocumentText text={artifact.summaryText} highlightColor={p?.authorHighlightColor} />
      </div>

      {artifact.type === 'cuestionario' && data ? (
        <section className="mt-8 border-t-2 border-rule pt-6">
          <h2 className="text-h3 text-strong">Anexo: preguntas y soluciones</h2>
          <ol className="mt-4 space-y-4">
            {data.map((q: any, i: number) => (
              <li key={i} className="rounded-control border border-rule bg-subtle p-4 text-small">
                <p className="text-body-strong text-strong">
                  {i + 1}. {q.question}
                </p>
                <ul className="mt-2 space-y-1 pl-4">
                  {q.options?.map((opt: string, j: number) => {
                    const correct = opt === q.correctAnswer;
                    return (
                      <li key={j} className={correct ? 'font-semibold text-success' : 'text-default'}>
                        • {opt}
                        {correct ? ' (respuesta correcta)' : ''}
                      </li>
                    );
                  })}
                </ul>
                {q.explanation ? (
                  <p className="mt-2 rounded-small bg-surface p-2 italic text-default">
                    <strong className="not-italic">Explicación:</strong> {q.explanation}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {artifact.type === 'flashcards' && data ? (
        <section className="mt-8 border-t-2 border-rule pt-6">
          <h2 className="text-h3 text-strong">Anexo: tarjetas de repaso</h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.map((card: any, i: number) => (
              <li key={i} className="space-y-1.5 rounded-control border border-rule bg-subtle p-4 text-small">
                <span className="inline-flex rounded-small bg-highlight px-2 font-mono text-caption text-highlight-ink">
                  {card.category || `Tarjeta ${i + 1}`}
                </span>
                <p className="text-body-strong text-strong">{card.question}</p>
                <p className="rounded-small bg-surface p-2 text-default">{card.answer}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {artifact.citations && artifact.citations.length > 0 ? (
        <section className="mt-10 rounded-control border border-rule bg-subtle p-5">
          <h2 className="flex items-center gap-2 text-label text-strong">
            <Icon name="check" className="size-4 text-success" />
            Fuentes consultadas
          </h2>
          <p className="mt-1 text-small text-muted">
            Este material se generó a partir de la información de las fuentes del cuaderno.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {artifact.citations.map((cite, i) => (
              <li
                key={i}
                className="inline-flex items-center gap-1 rounded-small border border-rule bg-surface px-2.5 py-1 text-small text-default"
              >
                <Icon name="attach" className="size-3.5 text-muted" />
                {cite}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-10 flex items-center justify-between border-t border-rule pt-3 text-caption text-muted">
        <span>{info.label}</span>
        <span>Material de estudio</span>
      </footer>
    </article>
  );
}
