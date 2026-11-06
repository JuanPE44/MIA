import {useState, type FormEvent} from 'react';
import {Check, Copy, ExternalLink, Plus, Search} from 'lucide-react';
import {useAppState} from '../../app/AppStateContext';
import {
  Button,
  Card,
  InlineAlert,
  SegmentedControl,
  SimulatedBadge,
  Spinner,
  StatusBadge,
  TextField,
  useToast,
} from '../../ui';
import {HIT_44} from '../../ui/internal/cx';
import {Markdown} from '../chat/markdown';
import {
  MODE_OPTIONS,
  SUGGESTIONS,
  VERDICT_LABEL,
  searchGrounding,
  turnToSource,
  type SearchMode,
  type SearchTurn,
} from './searchModel';

interface WebSearchPanelProps {
  /** Prefills the question field (e.g. from the Chat composer). */
  initialQuery?: string;
}

/**
 * "Buscar en la web" content (S8). Shared by the standalone dialog and the
 * "Desde la web" tab of the add-source dialog.
 */
export function WebSearchPanel({initialQuery}: WebSearchPanelProps) {
  const {activeNotebook, handleSaveSearchSource} = useAppState();
  const toast = useToast();
  const [mode, setMode] = useState<SearchMode>('general');
  const [query, setQuery] = useState(initialQuery ?? '');
  const [fieldError, setFieldError] = useState<string>();
  const [turns, setTurns] = useState<SearchTurn[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const busy = turns.some((t) => t.status === 'loading');
  const modeMeta = MODE_OPTIONS.find((m) => m.value === mode) ?? MODE_OPTIONS[0];

  const run = async (turnId: string, message: string, searchMode: SearchMode, previous: SearchTurn[]) => {
    try {
      const result = await searchGrounding(message, searchMode, previous);
      setTurns((prev) => prev.map((t) => (t.id === turnId ? {...t, ...result, status: 'done'} : t)));
    } catch {
      setTurns((prev) => prev.map((t) => (t.id === turnId ? {...t, status: 'error'} : t)));
    }
  };

  const start = (text: string) => {
    const message = text.trim();
    if (!message) {
      setFieldError('Escribe una pregunta o una afirmación para buscar.');
      return;
    }
    if (busy) return;
    setFieldError(undefined);
    const turn: SearchTurn = {id: `turn-${Date.now()}`, query: message, mode, status: 'loading'};
    const previous = turns;
    setTurns([turn, ...turns]);
    setQuery('');
    void run(turn.id, message, mode, previous);
  };

  const retry = (turn: SearchTurn) => {
    setTurns((prev) => prev.map((t) => (t.id === turn.id ? {...t, status: 'loading'} : t)));
    const previous = turns.filter((t) => t.id !== turn.id);
    void run(turn.id, turn.query, turn.mode, previous);
  };

  const copy = async (turn: SearchTurn) => {
    try {
      await navigator.clipboard.writeText(turn.reply ?? '');
      setCopiedId(turn.id);
      setTimeout(() => setCopiedId((id) => (id === turn.id ? null : id)), 2000);
    } catch {
      toast.show({variant: 'warning', message: 'No se pudo copiar. Selecciona el texto y cópialo a mano.'});
    }
  };

  const addAsSource = (turn: SearchTurn) => {
    handleSaveSearchSource(turnToSource(turn));
    setAddedIds((ids) => [...ids, turn.id]);
    toast.show({variant: 'success', message: 'Añadida a Fuentes'});
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    start(query);
  };

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        aria-label="Tipo de búsqueda"
        options={MODE_OPTIONS.map((m) => ({value: m.value, label: m.label}))}
        value={mode}
        onValueChange={setMode}
        className="self-start max-sm:flex max-sm:w-full max-sm:overflow-x-auto"
      />

      <form noValidate onSubmit={onSubmit} className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <TextField
            label="Tu pregunta"
            leadingIcon={<Search aria-hidden />}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (fieldError) setFieldError(undefined);
            }}
            placeholder={modeMeta.placeholder}
            error={fieldError}
          />
        </div>
        <Button type="submit" variant="primary" loading={busy}>
          Buscar
        </Button>
      </form>

      {turns.length === 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-label text-muted">Prueba con</p>
          <ul className="flex flex-wrap gap-2">
            {SUGGESTIONS[mode].map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => start(s)}
                  className={`${HIT_44} rounded-pill border border-control bg-surface px-3 py-1.5 text-left text-label text-default hover:bg-subtle`}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {turns.length > 0 ? (
        <ol className="flex flex-col gap-4" aria-label="Resultados de búsqueda" aria-live="polite">
          {turns.map((turn) => {
            const verdict = turn.verdict ? VERDICT_LABEL[turn.verdict] : null;
            const added = addedIds.includes(turn.id);
            return (
              <li key={turn.id}>
                <Card className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 flex-1 text-body-strong text-strong">{turn.query}</p>
                    {verdict ? <StatusBadge variant={verdict.variant}>{verdict.label}</StatusBadge> : null}
                    {turn.status === 'done' ? <SimulatedBadge /> : null}
                  </div>

                  {turn.status === 'loading' ? (
                    <p className="flex items-center gap-2 text-body text-muted" role="status">
                      <Spinner size={20} />
                      Buscando en la web…
                    </p>
                  ) : null}

                  {turn.status === 'error' ? (
                    <InlineAlert
                      variant="danger"
                      live
                      title="No se pudo completar la búsqueda"
                      actions={
                        <Button size="sm" variant="secondary" onClick={() => retry(turn)}>
                          Reintentar
                        </Button>
                      }
                    >
                      Revisa tu conexión e inténtalo de nuevo.
                    </InlineAlert>
                  ) : null}

                  {turn.status === 'done' ? (
                    <>
                      <Markdown text={turn.reply ?? ''} className="text-body text-default" />
                      {turn.sources && turn.sources.length > 0 ? (
                        <div>
                          <p className="text-label text-muted">Fuentes</p>
                          <ul className="mt-1 flex flex-col gap-1">
                            {turn.sources.map((s) => (
                              <li key={s.url}>
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-8 items-center gap-1.5 text-small text-primary-text underline pointer-coarse:min-h-11"
                                >
                                  <ExternalLink aria-hidden className="size-4 shrink-0" />
                                  <span>
                                    {s.title || s.domain}
                                    <span className="text-muted"> · {s.domain}</span>
                                    <span className="sr-only"> (se abre en una pestaña nueva)</span>
                                  </span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-hairline pt-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          leadingIcon={copiedId === turn.id ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
                          onClick={() => copy(turn)}
                        >
                          {copiedId === turn.id ? 'Copiado' : 'Copiar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          leadingIcon={added ? <Check aria-hidden className="size-4" /> : <Plus aria-hidden className="size-4" />}
                          disabled={added || !activeNotebook}
                          disabledReason={added ? 'Ya está en Fuentes' : 'Abre un cuaderno para añadirla'}
                          onClick={() => addAsSource(turn)}
                        >
                          {added ? 'Añadida' : 'Añadir como fuente'}
                        </Button>
                      </div>
                    </>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
