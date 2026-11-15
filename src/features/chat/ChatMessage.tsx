import {useState, type ReactNode} from 'react';
import {Button, Chip, CitationChip, IconButton, InlineAlert, SimulatedBadge, Spinner, Textarea} from '../../ui';
import {AI_SIMULATED} from '../../ui';
import type {ChatMessage as ChatMessageData, CitationChunk} from '../../types';
import {Markdown} from './markdown';
import {Icon} from '../../ui/Icon';

const UNKNOWN_ANSWER = 'Lo siento, no tengo acceso a esa información en mis manuales.';

function AssistantAvatar() {
  return (
    <span
      aria-hidden
      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-small border border-ink bg-highlight text-highlight-ink"
    >
      <Icon name="sparkles" weight="fill" className="size-4" />
    </span>
  );
}

/** User question: right-aligned bubble. */
export function UserMessage({message}: {message: ChatMessageData}) {
  return (
    <div className="flex justify-end">
      <p className="max-w-narrow whitespace-pre-wrap break-words rounded-card rounded-br-small border border-ink bg-surface px-4 py-2 text-body text-strong shadow-offset">
        {message.text}
      </p>
    </div>
  );
}

/** Placeholder shown while the service is answering. */
export function PendingMessage() {
  return (
    <div className="flex gap-3" role="status">
      <AssistantAvatar />
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
    <div className="flex gap-3">
      <AssistantAvatar />
      <InlineAlert
        variant="danger"
        live
        className="flex-1"
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
}: AssistantMessageProps) {
  const [commenting, setCommenting] = useState(false);
  const [comment, setComment] = useState('');
  const chunks = message.retrievedChunks ?? [];
  const isUnknown = message.text.includes(UNKNOWN_ANSWER);
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
        className="mx-0.5 pointer-coarse:min-h-6"
      />
    );
  };

  const readingClass = 'font-sans text-[1.0625rem] leading-[1.75rem] text-default';

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-8">
    <div className="flex min-w-0 gap-3">
      <AssistantAvatar />
      <div className="min-w-0 flex-1">
        {message.isGroundingWarning || isUnknown ? (
          <InlineAlert variant="warning">
            <Markdown text={message.text} className={readingClass} renderCitation={renderCitation} />
          </InlineAlert>
        ) : (
          <Markdown text={message.text} className={readingClass} renderCitation={renderCitation} />
        )}

        {chunks.length > 0 || citedOnly.length > 0 ? (
          <ul className={`mt-3 flex flex-wrap gap-2 ${chunks.length > 0 ? 'lg:hidden' : ''}`} aria-label="Fuentes citadas">
            {chunks.map((chunk) => (
              <li key={chunk.index}>
                <button
                  type="button"
                  onClick={() => onOpenChunk(chunk)}
                  aria-label={`Ver fuente ${chunk.index}: ${chunk.sourceTitle}, ${chunk.location}`}
                  className="relative rounded-pill pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2 pointer-coarse:after:content-['']"
                >
                  <Chip variant="outline" size="sm" icon={<Icon name="document" />} className="hover:border-ink">
                    <span className="max-w-3xs truncate">
                      Fuente {chunk.index} · {chunk.sourceTitle}
                    </span>
                  </Chip>
                </button>
              </li>
            ))}
            {citedOnly.map((title) => (
              <li key={title}>
                <Chip variant="outline" size="sm" icon={<Icon name="document" />}>
                  <span className="max-w-3xs truncate">{title}</span>
                </Chip>
              </li>
            ))}
          </ul>
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

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {AI_SIMULATED ? <SimulatedBadge /> : null}
          {showFeedback ? (
            <>
              <IconButton
                size="sm"
                aria-label="Respuesta útil"
                aria-pressed={message.feedback === 'positive'}
                icon={<Icon name="thumbs-up" className={`size-4 ${message.feedback === 'positive' ? 'fill-current' : ''}`} />}
                className={message.feedback === 'positive' ? 'text-primary-text' : 'text-muted'}
                onClick={() => onFeedback(message.feedback === 'positive' ? null : 'positive')}
              />
              <IconButton
                size="sm"
                aria-label="Respuesta no útil"
                aria-pressed={message.feedback === 'negative'}
                icon={<Icon name="thumbs-down" className={`size-4 ${message.feedback === 'negative' ? 'fill-current' : ''}`} />}
                className={message.feedback === 'negative' ? 'text-primary-text' : 'text-muted'}
                onClick={() => onFeedback(message.feedback === 'negative' ? null : 'negative')}
              />
              <Button
                variant="ghost"
                size="sm"
                aria-expanded={commenting}
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
    {chunks.length > 0 ? (
      <aside aria-label="Notas al margen" className="mt-3 hidden space-y-3 lg:block">
        {chunks.map((chunk) => (
          <button
            key={chunk.index}
            type="button"
            onClick={() => onOpenChunk(chunk)}
            aria-label={`Ver fuente ${chunk.index}: ${chunk.sourceTitle}, ${chunk.location}`}
            className="block w-full rounded-small border-l-2 border-ink bg-subtle px-3 py-2 text-left transition-[box-shadow,translate] duration-[120ms] hover:-translate-x-px hover:-translate-y-px hover:shadow-offset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
