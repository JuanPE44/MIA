import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {MessagesSquare, Plus} from 'lucide-react';
import {useAppState} from '../../app/AppStateContext';
import {Button, Chip, Dialog, EmptyState, IconButton, useToast} from '../../ui';
import type {ChatMessage as ChatMessageData, CitationChunk} from '../../types';
import {AssistantMessage, ErrorMessage, PendingMessage, UserMessage} from './ChatMessage';
import {CitationInspector} from './CitationInspector';
import {Composer} from './Composer';
import {ThreadsList} from './ThreadsPanel';

const IMPROVEMENT_PREFIX = 'Solicitud de mejora: ';
const GENERIC_SUGGESTIONS = [
  '¿Cuáles son los puntos clave de mis fuentes?',
  'Resume las fuentes en cinco ideas',
  '¿Qué conceptos centrales se explican?',
];

const now = () => new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});

/** Wraps an improvement request the same way the legacy chat did. */
function improvementMessage(comment: string): string {
  return `El estudiante solicitó la siguiente mejora sobre la respuesta anterior: "${comment}". Modifica únicamente aquello que sea necesario y conserva el estricto anclaje a datos y citas de las fuentes.`;
}

export function ChatScreen() {
  const {
    activeNotebook,
    currentThreads,
    currentActiveThread,
    currentActiveThreadId,
    handleStartNewChat,
    handleSelectChatThread,
    handleRenameChatThread,
    handleRemoveChatThread,
    handleUpdateThreadMessages,
    handleOpenGoogleSearch,
    handleSelectAllSourcesForChat,
    goToSegment,
    chatInitialPrompt,
    setChatInitialPrompt,
  } = useAppState();
  const toast = useToast();

  const [input, setInput] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [chunk, setChunk] = useState<CitationChunk | null>(null);
  const [threadsOpen, setThreadsOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const notebookId = activeNotebook?.id;
  const threadId = currentActiveThread?.id;

  // Latest values for async completions (the render that started a request is stale by then).
  const latest = useRef({handleUpdateThreadMessages, notebookId, threadId});
  latest.current = {handleUpdateThreadMessages, notebookId, threadId};

  const messages = currentActiveThread?.messages ?? [];
  const sources = activeNotebook?.sources ?? [];
  const activeSources = useMemo(() => sources.filter((s) => s.selectedForChat !== false), [sources]);
  const lastMessage = messages[messages.length - 1];
  // A question without an answer after it means the request failed (or was interrupted).
  const failed = !waiting && lastMessage?.sender === 'user';

  // A question handed over from Fuentes ("Preguntar sobre esta fuente").
  useEffect(() => {
    if (!chatInitialPrompt) return;
    setInput(chatInitialPrompt);
    setChatInitialPrompt(undefined);
    inputRef.current?.focus();
  }, [chatInitialPrompt, setChatInitialPrompt]);

  // Switching thread resets the draft and puts the cursor in the composer.
  useEffect(() => {
    setInput('');
    inputRef.current?.focus({preventScroll: true});
  }, [threadId]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    endRef.current?.scrollIntoView({block: 'end', behavior: reduce ? 'auto' : 'smooth'});
  }, [messages.length, waiting, failed]);

  const suggestions = useMemo(() => {
    const fromAnalysis = (activeNotebook?.analysis?.keyConcepts ?? [])
      .slice(0, 3)
      .map((c) => `¿Qué es «${c.term}»?`);
    return [...fromAnalysis, ...GENERIC_SUGGESTIONS].slice(0, 3);
  }, [activeNotebook?.analysis]);

  /** Sends `history` (ending in the user's message) to the service and stores the answer. */
  const requestAnswer = useCallback(
    async (history: ChatMessageData[], apiMessage: string) => {
      if (!activeNotebook || !currentActiveThread) return;
      const targetNotebook = activeNotebook.id;
      const targetThread = currentActiveThread.id;
      setWaiting(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            message: apiMessage,
            history,
            sources: activeSources,
            analysis: activeNotebook.analysis,
            notebookTitle: activeNotebook.title,
          }),
        });
        if (!res.ok) throw new Error(`Chat service responded ${res.status}`);
        const data = await res.json();
        if (typeof data?.reply !== 'string' || !data.reply.trim()) throw new Error('Chat service sent no reply');

        const answer: ChatMessageData = {
          id: `msg-bot-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          timestamp: now(),
          sourcesCited: data.sourcesCited,
          retrievedChunks: data.retrievedChunks || [],
          isGroundingWarning: data.isGroundingWarning,
          suggestArtifactAction: data.suggestArtifactAction,
        };
        // Only store it if the user is still looking at the same notebook and thread.
        const current = latest.current;
        if (current.notebookId === targetNotebook && current.threadId === targetThread) {
          current.handleUpdateThreadMessages(targetThread, [...history, answer]);
        }
      } catch (err) {
        // The unanswered question stays in the thread: the error variant + Reintentar is derived from it.
        console.error('Chat request failed', err);
      } finally {
        setWaiting(false);
      }
    },
    [activeNotebook, activeSources, currentActiveThread],
  );

  if (!activeNotebook || !currentActiveThread) return null;

  const hasSources = sources.length > 0;
  const hasActiveSources = activeSources.length > 0;
  const disabledReason = !hasSources
    ? 'Añade fuentes para poder preguntar.'
    : !hasActiveSources
      ? 'Activa al menos una fuente para preguntar.'
      : undefined;

  const appendAndAsk = (text: string, apiMessage: string) => {
    const userMessage: ChatMessageData = {id: `msg-${Date.now()}`, sender: 'user', text, timestamp: now()};
    const history = [...messages, userMessage];
    handleUpdateThreadMessages(currentActiveThread.id, history);
    void requestAnswer(history, apiMessage);
  };

  const send = () => {
    const text = input.trim();
    if (!text || waiting || disabledReason) return;
    setInput('');
    appendAndAsk(text, text);
  };

  const retry = () => {
    if (!lastMessage || lastMessage.sender !== 'user' || waiting || disabledReason) return;
    const text = lastMessage.text;
    const apiMessage = text.startsWith(IMPROVEMENT_PREFIX) ? improvementMessage(text.slice(IMPROVEMENT_PREFIX.length)) : text;
    void requestAnswer(messages, apiMessage);
  };

  const setFeedback = (messageId: string, feedback: 'positive' | 'negative' | null) => {
    handleUpdateThreadMessages(
      currentActiveThread.id,
      messages.map((m) => (m.id === messageId ? {...m, feedback: feedback ?? undefined} : m)),
    );
  };

  const submitComment = (messageId: string, comment: string) => {
    const marked = messages.map((m) =>
      m.id === messageId ? {...m, feedback: 'improvement' as const, feedbackComment: comment} : m,
    );
    const userMessage: ChatMessageData = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: `${IMPROVEMENT_PREFIX}${comment}`,
      timestamp: now(),
    };
    const history = [...marked, userMessage];
    handleUpdateThreadMessages(currentActiveThread.id, history);
    void requestAnswer(history, improvementMessage(comment));
  };

  const deleteThread = (id: string) => {
    const outcome = handleRemoveChatThread(id);
    if (outcome === 'replaced') {
      toast.show({message: 'Era tu único chat. Creamos uno nuevo vacío: «Chat 1».', variant: 'info'});
    } else {
      toast.show({message: 'Chat eliminado.', variant: 'success'});
    }
  };

  const threadsList = (afterSelect?: () => void) => (
    <ThreadsList
      threads={currentThreads}
      activeThreadId={currentActiveThreadId}
      onSelect={(id) => {
        handleSelectChatThread(id);
        afterSelect?.();
      }}
      onNewChat={() => {
        handleStartNewChat();
        afterSelect?.();
      }}
      onRename={handleRenameChatThread}
      onDelete={deleteThread}
    />
  );

  const lastQuestion = [...messages].reverse().find((m) => m.sender === 'user')?.text;

  let body;
  if (!hasSources) {
    body = (
      <EmptyState
        icon={<MessagesSquare />}
        title="Añade fuentes para empezar a preguntar"
        description="MIA responde con lo que dicen tus fuentes. Sube un PDF, un enlace o un texto."
        action={
          <Button variant="primary" onClick={() => goToSegment('FUENTES')}>
            Ir a Fuentes
          </Button>
        }
      />
    );
  } else if (!hasActiveSources) {
    body = (
      <EmptyState
        icon={<MessagesSquare />}
        title="No hay fuentes activas para este chat"
        description="Activa al menos una fuente para que MIA pueda responder."
        action={
          <Button variant="primary" onClick={() => handleSelectAllSourcesForChat(true)}>
            Activar todas las fuentes ({sources.length})
          </Button>
        }
        secondaryAction={
          <Button variant="ghost" onClick={() => goToSegment('FUENTES')}>
            Gestionar fuentes
          </Button>
        }
      />
    );
  } else if (messages.length === 0) {
    body = (
      <div className="py-8">
        <h2 className="text-h2 text-strong">Pregunta sobre tus fuentes</h2>
        <p className="mt-1 text-body text-muted">Prueba con una de estas preguntas o escribe la tuya.</p>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Preguntas sugeridas">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => {
                  setInput(s);
                  inputRef.current?.focus();
                }}
                className="inline-flex text-left pointer-coarse:min-h-11 pointer-coarse:items-center"
              >
                <Chip variant="outline" className="h-auto min-h-7 whitespace-normal py-1 hover:bg-subtle">
                  {s}
                </Chip>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  } else {
    body = (
      <div role="log" aria-live="polite" aria-label="Conversación" className="space-y-6 py-6">
        {messages.map((m) =>
          m.sender === 'user' ? (
            <UserMessage key={m.id} message={m} />
          ) : (
            <AssistantMessage
              key={m.id}
              message={m}
              lastQuestion={lastQuestion}
              busy={waiting}
              onOpenChunk={setChunk}
              onFeedback={(rating) => setFeedback(m.id, rating)}
              onSubmitComment={(comment) => submitComment(m.id, comment)}
              onCreateArtifact={() => goToSegment('ARTEFACTOS')}
              onSearchWeb={handleOpenGoogleSearch}
            />
          ),
        )}
        {waiting ? <PendingMessage /> : null}
        {failed ? <ErrorMessage onRetry={retry} /> : null}
      </div>
    );
  }

  return (
    <section aria-label="Chat" className="flex flex-col lg:flex-row lg:gap-6">
      {/* Desktop: threads panel */}
      <aside aria-label="Chats" className="hidden w-[280px] shrink-0 lg:block">
        <div className="sticky top-4">{threadsList()}</div>
      </aside>

      {/* Tablet / phone: 48 px sub-header */}
      <div className="flex h-12 items-center justify-between gap-2 border-b border-hairline lg:hidden">
        <Button
          variant="ghost"
          leadingIcon={<MessagesSquare aria-hidden className="size-5" />}
          onClick={() => setThreadsOpen(true)}
          className="min-w-0"
        >
          <span className="truncate">Chats · {currentActiveThread.title}</span>
        </Button>
        <IconButton
          aria-label="Nuevo chat"
          icon={<Plus aria-hidden className="size-5" />}
          onClick={handleStartNewChat}
        />
      </div>
      <Dialog open={threadsOpen} onClose={() => setThreadsOpen(false)} title="Chats" size="sm">
        {threadsList(() => setThreadsOpen(false))}
      </Dialog>

      {/* Conversation */}
      <div className="mx-auto flex w-full min-w-0 max-w-[720px] flex-1 flex-col">
        <h1 className="sr-only">Chat: {currentActiveThread.title}</h1>
        <div className="min-h-[40vh] flex-1">
          {body}
          <div ref={endRef} className="scroll-mb-48" />
        </div>

        <div className="sticky bottom-0 z-10 bg-page pb-[var(--mia-bottom-bar,0px)] pt-2">
          <div className="pb-2">
            <Composer
              value={input}
              onChange={setInput}
              onSend={send}
              waiting={waiting}
              disabledReason={disabledReason}
              activeSources={activeSources.length}
              totalSources={sources.length}
              onOpenSources={() => goToSegment('FUENTES')}
              onSearchWeb={() => handleOpenGoogleSearch(input.trim() || undefined)}
              inputRef={inputRef}
            />
          </div>
        </div>
      </div>

      <CitationInspector chunk={chunk} onClose={() => setChunk(null)} onOpenSources={() => goToSegment('FUENTES')} />
    </section>
  );
}
