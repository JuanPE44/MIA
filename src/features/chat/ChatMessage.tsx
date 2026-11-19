import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {AppMark, Button, CitationChip, IconButton, InlineAlert, Spinner, Textarea} from '../../ui';
import type {ChatMessage as ChatMessageData, CitationChunk} from '../../types';
import {Markdown} from './markdown';
import {Icon} from '../../ui/Icon';

const UNKNOWN_ANSWER = 'Lo siento, no tengo acceso a esa información en mis manuales.';

/** Small mono "MIA" label that introduces an assistant turn. */
function MiaLabel() {
  return (
    <p className="mb-1 flex items-center gap-1.5 font-mono text-caption text-muted">
      <AppMark size={16} />
      MIA
    </p>
  );
}

/** Removes raw "[Fuente: …]" / "[Fuentes: …]" markers; render-time only, stored text is untouched. */
export function stripSourceMarkers(text: string): string {
  return text
    .replace(/[ \t]*\[Fuentes?:[^\]\n]*\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}


const REVEAL_MAX_MS = 1500;
const REVEAL_MIN_MS = 600;

/** Closes dangling markup of a partially revealed text so the Markdown renderer does not flash raw markers. */
function closeOpenMarkup(text: string): string {
  let out = text.replace(/\[\d*$/, '');
  if ((out.match(/\*\*/g) ?? []).length % 2 === 1) out += '**';
  return out;
}

/**
 * Reveals `text` word by word (~1.5 s at most) for a freshly received answer.
 * With `enabled` false (history) or `prefers-reduced-motion`, the whole text is returned at once.
 */
function useWordReveal(text: string, enabled: boolean, onDone?: () => void): {shown: string; done: boolean} {
  const tokens = useMemo(() => text.match(/\S+\s*/g) ?? [], [text]);
  const total = tokens.length;
  const [count, setCount] = useState<number>(() => {
    if (!enabled) return Infinity;
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return reduce ? Infinity : 0;
  });

  useEffect(() => {
    if (!enabled || count === Infinity) return;
    const duration = Math.min(REVEAL_MAX_MS, Math.max(REVEAL_MIN_MS, total * 35));
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setCount(Math.ceil(total * progress));
      if (progress < 1) frame = requestAnimationFrame(step);
      else onDone?.();
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // Runs once per message: `count` only gates the Infinity (already revealed) case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, total]);

  const done = count >= total;
  return {shown: done ? text : tokens.slice(0, count).join(''), done};
}

/** User question: right-aligned bubble. */
export function UserMessage({message}: {message: ChatMessageData}) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-card bg-subtle px-4 py-2 text-body text-default">
        {message.text}
      </p>
    </div>
  );
}

/** Placeholder shown while the service is answering. */
export function PendingMessage() {
  return (
    <div role="status">
      <MiaLabel />
      <p className="flex items-center gap-2 font-mono text-small text-muted">
        <Spinner size={16} />
        Pensando…
      </p>
    </div>
  );
}

/**
 * Error variant (UX-01): no citations, no verification copy, no invented
 * content. The question stays in the thread and can be re-sent.
 */
export function ErrorMessage({onRetry}: {onRetry: () => void}) {
  return (
    <div>
      <MiaLabel />
      <InlineAlert
        variant="danger"
        live
        title="No pude responder. Tu pregunta quedó guardada."
        actions={
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        }
      />
    </div>
  );
}

interface AssistantMessageProps {
  message: ChatMessageData;
  /** Last question asked, used for the "search the web" hand-off. */
  lastQuestion?: string;
  onOpenChunk: (chunk: CitationChunk) => void;
  onFeedback: (rating: 'positive' | 'negative' | null) => void;
  onSubmitComment: (comment: string) => void;
  onCreateArtifact: () => void;
  onSearchWeb: (query?: string) => void;
  busy: boolean;
  /** Reveal the text word by word (only for the answer that just arrived). */
  streaming?: boolean;
  onStreamDone?: () => void;
}

export function AssistantMessage({
  message,
  lastQuestion,
  onOpenChunk,
  onFeedback,
  onSubmitComment,
  onCreateArtifact,
  onSearchWeb,
  busy,
  streaming = false,
  onStreamDone,
}: AssistantMessageProps) {
  const [commenting, setCommenting] = useState(false);
  const [comment, setComment] = useState('');
  const chunks = message.retrievedChunks ?? [];
  const isUnknown = message.text.includes(UNKNOWN_ANSWER);
  const text = stripSourceMarkers(message.text);
  const {shown, done} = useWordReveal(text, streaming, onStreamDone);
  const showFeedback = !message.isGroundingWarning;
  const citedOnly = chunks.length === 0 ? (message.sourcesCited ?? []) : [];

  const renderCitation = (index: number): ReactNode | null => {
    const chunk = chunks.find((c) => c.index === index);
    if (!chunk) return null;
    return (
      <CitationChip
        n={index}
        onClick={() => onOpenChunk(chunk)}
        aria-label={`Ver fuente ${index}: ${chunk.sourceTitle}`}
        className="mx-0.5 cursor-pointer hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:min-h-6"
      />
    );
  };

  const readingClass = 'font-sans text-[1.0625rem] leading-[1.75rem] text-default';

  return (
    <div className="group/msg relative">
    <div className="min-w-0">
      <div className="min-w-0">
        <MiaLabel />
        {!done ? (
          <>
            <div aria-hidden>
              <Markdown text={closeOpenMarkup(shown)} className={readingClass} renderCitation={renderCitation} />
            </div>
            <p className="sr-only">{text}</p>
          </>
        ) : message.isGroundingWarning || isUnknown ? (
          <InlineAlert variant="warning">
            <Markdown text={text} className={readingClass} renderCitation={renderCitation} />
          </InlineAlert>
        ) : (
          <Markdown text={text} className={readingClass} renderCitation={renderCitation} />
        )}

        <div className={done ? undefined : 'invisible'} aria-hidden={done ? undefined : true}>
        {chunks.length > 0 || citedOnly.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <p className="text-small text-muted">
              {chunks.length + citedOnly.length} {chunks.length + citedOnly.length === 1 ? 'fuente' : 'fuentes'}
            </p>
            <ul className="flex flex-wrap items-center gap-1" aria-label="Fuentes citadas">
              {chunks.map((chunk) => (
                <li key={chunk.index} className="flex">
                  <CitationChip
                    n={chunk.index}
                    title={chunk.sourceTitle}
                    onClick={() => onOpenChunk(chunk)}
                    aria-label={`Ver fuente ${chunk.index}: ${chunk.sourceTitle}, ${chunk.location}`}
                    className="cursor-pointer transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:min-h-6 pointer-coarse:min-w-6"
                  />
                </li>
              ))}
              {citedOnly.map((title, i) => (
                <li key={title} className="flex" title={title}>
                  <CitationChip n={i + 1} />
                  <span className="sr-only">{title}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {isUnknown ? (
          <div className="mt-3">
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Icon name="web" className="size-4" />}
              onClick={() => onSearchWeb(lastQuestion)}
            >
              Buscar en la web
            </Button>
          </div>
        ) : null}

        <div
          className={`mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-muted transition-opacity motion-reduce:transition-none pointer-coarse:opacity-100 group-focus-within/msg:opacity-100 group-hover/msg:opacity-100 ${
            commenting || message.feedback ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {showFeedback ? (
            <>
              <IconButton
                size="sm"
                aria-label="Respuesta útil"
                aria-pressed={message.feedback === 'positive'}
                icon={<Icon name="thumbs-up" className={`size-4 ${message.feedback === 'positive' ? 'fill-current' : ''}`} />}
                className={message.feedback === 'positive' ? 'text-strong' : 'text-muted'}
                onClick={() => onFeedback(message.feedback === 'positive' ? null : 'positive')}
              />
              <IconButton
                size="sm"
                aria-label="Respuesta no útil"
                aria-pressed={message.feedback === 'negative'}
                icon={<Icon name="thumbs-down" className={`size-4 ${message.feedback === 'negative' ? 'fill-current' : ''}`} />}
                className={message.feedback === 'negative' ? 'text-strong' : 'text-muted'}
                onClick={() => onFeedback(message.feedback === 'negative' ? null : 'negative')}
              />
              <Button
                variant="ghost"
                size="sm"
                aria-expanded={commenting}
                className="text-muted!"
                onClick={() => setCommenting((v) => !v)}
              >
                Comentar
              </Button>
            </>
          ) : null}
          {message.suggestArtifactAction ? (
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Icon name="book" className="size-4" />}
              onClick={onCreateArtifact}
            >
              Crear un material con esto
            </Button>
          ) : null}
        </div>

        {commenting ? (
          <form
            className="mt-2 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = comment.trim();
              if (!text) return;
              onSubmitComment(text);
              setComment('');
              setCommenting(false);
            }}
          >
            <Textarea
              label="Tu comentario sobre esta respuesta"
              helper="Pediremos a MIA que ajuste la respuesta."
              minRows={2}
              maxRows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" disabled={!comment.trim() || busy}>
                Enviar comentario
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCommenting(false);
                  setComment('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : null}
        </div>
      </div>
    </div>
    {chunks.length > 0 ? (
      <aside aria-label="Notas al margen" className={`absolute left-full top-0 ml-8 hidden w-60 space-y-3 min-[1560px]:block ${done ? '' : 'invisible'}`}>
        {chunks.map((chunk) => (
          <button
            key={chunk.index}
            type="button"
            onClick={() => onOpenChunk(chunk)}
            aria-label={`Ver fuente ${chunk.index}: ${chunk.sourceTitle}, ${chunk.location}`}
            className="block w-full rounded-small border-l-2 border-rule bg-subtle px-3 py-2 text-left transition-[box-shadow,translate] duration-[120ms] hover:-translate-x-px hover:-translate-y-px hover:shadow-offset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <span className="flex items-center gap-2">
              <CitationChip n={chunk.index} />
              <span className="min-w-0 truncate font-mono text-caption text-muted">{chunk.location}</span>
            </span>
            <span className="mt-1 block truncate text-label text-strong">{chunk.sourceTitle}</span>
            <span className="mt-1 line-clamp-3 font-display text-small italic text-default">{chunk.snippet}</span>
          </button>
        ))}
      </aside>
    ) : null}
    </div>
  );
}
