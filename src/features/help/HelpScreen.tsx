import {apiFetch} from '../../services/api';
import {useEffect, useRef, useState, type KeyboardEvent} from 'react';
import {useAppState} from '../../app/AppStateContext';
import {Button, Card, Chip, Highlight, IconButton, Page, PageHeader, Reveal, RevealItem, Textarea} from '../../ui';
import {ErrorMessage, PendingMessage, UserMessage} from '../chat/ChatMessage';
import {Markdown} from '../chat/markdown';
import {
  QUICK_ACTIONS,
  REQUEST_REPLY,
  loadMessages,
  loadRequests,
  saveMessages,
  saveRequests,
  type HelpMessage,
  type HelpRequest,
} from './helpModel';
import {FaqAccordion} from './FaqAccordion';
import {RequestCard} from './RequestCard';
import {Icon} from '../../ui/Icon';

function AssistantReply({message}: {message: HelpMessage}) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-pill bg-primary-tint text-primary-on-tint"
      >
        <Icon name="sparkles" weight="duotone" className="size-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <Markdown text={message.text} className="text-body text-default" />
        {message.request ? <RequestCard request={message.request} /> : null}
      </div>
    </div>
  );
}

/** "Ayuda" (S10): support assistant, session requests and FAQ. */
export function HelpScreen() {
  const {currentUser, plan, stats, activeNotebook} = useAppState();
  const [messages, setMessages] = useState<HelpMessage[]>(loadMessages);
  const [requests, setRequests] = useState<HelpRequest[]>(loadRequests);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => saveMessages(messages), [messages]);
  useEffect(() => saveRequests(requests), [requests]);
  useEffect(() => {
    endRef.current?.scrollIntoView?.({block: 'nearest'});
  }, [messages, loading, failed]);

  /** Asks the service. `history` already includes the question; on retry it is not added twice. */
  const ask = async (history: HelpMessage[], query: string) => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await apiFetch('/api/support-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: query,
          history: history.map((m) => ({role: m.role, text: m.text})),
          context: {
            username: currentUser || 'Estudiante',
            plan,
            currentView: 'explorer',
            activeNotebook: activeNotebook
              ? {
                  id: activeNotebook.id,
                  title: activeNotebook.title,
                  subject: activeNotebook.subject,
                  category: activeNotebook.category,
                  sourcesCount: activeNotebook.sources.length,
                  artifactsCount: activeNotebook.artifacts.length,
                }
              : null,
            activeSegment: 'GENERAL',
            stats,
          },
        }),
      });
      if (!res.ok) throw new Error('support-chat failed');
      const data = await res.json();
      const r = data.reservation;
      const request: HelpRequest | null = r
        ? {
            id: String(r.id ?? `req-${Date.now()}`),
            type: String(r.type ?? 'Solicitud'),
            subject: String(r.subject ?? '—'),
            dateTime: String(r.dateTime ?? '—'),
            hostOrRoom: String(r.hostOrRoom ?? '—'),
          }
        : null;
      const reply: HelpMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        // A request is not a booking: never relay service text claiming it was registered.
        text: request ? REQUEST_REPLY : String(data.reply || 'Recibí tu consulta. ¿En qué más puedo ayudarte?'),
        request,
      };
      setMessages((prev) => [...prev, reply]);
      if (request) setRequests((prev) => (prev.some((p) => p.id === request.id) ? prev : [request, ...prev]));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const send = (text: string) => {
    const query = text.trim();
    if (!query || loading) return;
    const history = [...messages, {id: `usr-${Date.now()}`, role: 'user' as const, text: query}];
    setMessages(history);
    setInput('');
    void ask(history, query);
  };

  const retry = () => {
    const last = [...messages].reverse().find((m) => m.role === 'user');
    if (last) void ask(messages, last.text);
  };

  const reset = () => {
    setMessages([]);
    setFailed(false);
    setInput('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    send(input);
  };

  return (
    <Page>
    <Reveal className="space-y-6">
      <RevealItem>
        <PageHeader
          className="border-b border-rule pb-6"
          title={<><Highlight trigger="mount" delay={0.15}>Ayuda</Highlight> cuando la necesites</>}
        />
      </RevealItem>

      <RevealItem className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="help-chat" className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 id="help-chat" className="font-display text-h2 text-strong">
              Asistente
            </h2>
            {messages.length > 0 ? (
              <Button variant="ghost" size="sm" leadingIcon={<Icon name="reset" className="size-4" />} onClick={reset}>
                Nueva conversación
              </Button>
            ) : null}
          </div>

          <Card className="space-y-4">
            <div role="log" aria-live="polite" aria-label="Conversación con el asistente" className="space-y-5">
              {messages.length === 0 ? (
                <p className="text-body text-default">
                  Hola. Puedo orientarte con problemas técnicos o prepararte una solicitud de tutoría o de sala de estudio.
                  Elige una opción o escribe tu consulta.
                </p>
              ) : (
                messages.map((m) =>
                  m.role === 'user' ? (
                    <UserMessage key={m.id} message={{id: m.id, sender: 'user', text: m.text, timestamp: ''}} />
                  ) : (
                    <AssistantReply key={m.id} message={m} />
                  ),
                )
              )}
              {loading ? <PendingMessage /> : null}
              {failed && !loading ? <ErrorMessage onRetry={retry} /> : null}
              <div ref={endRef} />
            </div>

            <ul aria-label="Acciones rápidas" className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((a) => (
                <li key={a.label}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => send(a.query)}
                    className="relative rounded-pill disabled:opacity-40 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2 pointer-coarse:after:content-['']"
                  >
                    <Chip variant="outline" className="hover:bg-subtle">
                      {a.label}
                    </Chip>
                  </button>
                </li>
              ))}
            </ul>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2 rounded-card border border-control bg-surface p-2 focus-within:border-ink"
            >
              <div className="min-w-0 flex-1 [&_label]:sr-only [&_textarea]:border-0 [&_textarea]:bg-transparent">
                <Textarea
                  label="Tu consulta"
                  placeholder="Escribe tu consulta…"
                  minRows={1}
                  maxRows={5}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                />
              </div>
              <IconButton
                type="submit"
                variant="primary"
                aria-label="Enviar consulta"
                icon={<Icon name="send" className="size-5" />}
                disabled={!input.trim() || loading}
              />
            </form>
          </Card>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="help-requests" className="space-y-3">
            <h2 id="help-requests" className="font-display text-h2 text-strong">
              Mis solicitudes
            </h2>
            {requests.length === 0 ? (
              <p className="text-small text-muted">Todavía no enviaste solicitudes en esta sesión.</p>
            ) : (
              <ul className="space-y-3">
                {requests.map((r) => (
                  <li key={r.id}>
                    <RequestCard request={r} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="help-faq" className="space-y-3">
            <h2 id="help-faq" className="font-display text-h2 text-strong">
              Preguntas frecuentes
            </h2>
            <FaqAccordion />
          </section>
        </div>
      </RevealItem>
    </Reveal>
    </Page>
  );
}
