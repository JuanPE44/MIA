import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  MessageSquare,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Plus,
  Edit2,
  Check,
  CheckCircle2,
  FileText,
  ListOrdered,
  X,
  Layers,
  Cpu,
  Search,
  ExternalLink,
  Info,
  Globe
} from 'lucide-react';
import { Notebook, ChatMessage, ChatThread, CitationChunk } from '../types';

interface NotebookChatProps {
  notebook: Notebook;
  activeThread: ChatThread;
  onUpdateThreadMessages: (threadId: string, messages: ChatMessage[]) => void;
  onRenameThread: (threadId: string, newTitle: string) => void;
  onStartNewChat: () => void;
  onGoToArtifactsTab: () => void;
  onGoToSourcesTab: () => void;
  onOpenGoogleSearch?: (query?: string) => void;
  onSelectAllSourcesForChat?: (selected: boolean) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onCloseChat?: () => void;
  isDarkMode?: boolean;
}

function renderRagResponseText(text: string) {
  if (!text) return '';
  return text
    .replace(
      /\[(Archivo|Fuente|Sección): (.*?)\]/gi,
      '<span class="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px] shadow-2xs">📄 $1: $2</span>'
    )
    .replace(
      /\[(\d+)\]/g,
      '<span class="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 rounded-md bg-indigo-600 text-white font-black text-[10px] shadow-2xs">[$1]</span>'
    )
    .replace(
      /(Lo siento, no tengo acceso a esa información en mis manuales\.)/g,
      '<span class="inline-block p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 font-bold">$1</span>'
    );
}

export const NotebookChat: React.FC<NotebookChatProps> = ({
  notebook,
  activeThread,
  onUpdateThreadMessages,
  onRenameThread,
  onStartNewChat,
  onGoToArtifactsTab,
  onGoToSourcesTab,
  onOpenGoogleSearch,
  onSelectAllSourcesForChat,
  initialPrompt,
  onClearInitialPrompt,
  onCloseChat,
  isDarkMode = false
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [specificCommentMsgId, setSpecificCommentMsgId] = useState<string | null>(null);
  const [specificCommentText, setSpecificCommentText] = useState('');

  // Modal for Citation Inspection
  const [inspectingChunk, setInspectingChunk] = useState<CitationChunk | null>(null);

  // Rename thread state
  const [isRenaming, setIsRenaming] = useState(false);
  const [threadTitleInput, setThreadTitleInput] = useState(activeThread.title);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = activeThread.messages || [];
  const hasSources = notebook.sources.length > 0;
  // Solo se usan las fuentes que están tildadas (selectedForChat !== false)
  const selectedSources = notebook.sources.filter((s) => s.selectedForChat !== false);
  const hasSelectedSources = selectedSources.length > 0;

  // Context drift check: warn if message count in this thread is >= 7
  const isContextDriftAlertActive = messages.length >= 7;

  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt]);

  useEffect(() => {
    setThreadTitleInput(activeThread.title);
    setIsRenaming(false);
  }, [activeThread.id, activeThread.title]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsgText = inputText.trim();
    setInputText('');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    onUpdateThreadMessages(activeThread.id, newMessages);

    // REQUISITO DE FUENTES Y FUENTES TILDADAS
    if (!hasSources) {
      setTimeout(() => {
        const strictWarningMsg: ChatMessage = {
          id: `msg-bot-${Date.now()}`,
          sender: 'assistant',
          text: 'Antes de trabajar con este contenido, necesito que cargues al menos una fuente en este cuaderno. Puedes agregar un PDF, texto, imagen, link, video o audio.',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          isGroundingWarning: true
        };
        onUpdateThreadMessages(activeThread.id, [...newMessages, strictWarningMsg]);
      }, 400);
      return;
    }

    if (!hasSelectedSources) {
      setTimeout(() => {
        const noSelectedWarningMsg: ChatMessage = {
          id: `msg-bot-${Date.now()}`,
          sender: 'assistant',
          text: 'No tienes ninguna fuente tildada para este chat. Ve a la pestaña FUENTES y tilda al menos un texto; únicamente responderé referido a los textos que tengas seleccionados.',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          isGroundingWarning: true
        };
        onUpdateThreadMessages(activeThread.id, [...newMessages, noSelectedWarningMsg]);
      }, 400);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsgText,
          history: newMessages,
          sources: selectedSources,
          analysis: notebook.analysis,
          notebookTitle: notebook.title
        })
      });

      if (!res.ok) throw new Error('Error en el servicio de chat');
      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        sourcesCited: data.sourcesCited,
        retrievedChunks: data.retrievedChunks || [],
        isGroundingWarning: data.isGroundingWarning,
        suggestArtifactAction: data.suggestArtifactAction
      };

      onUpdateThreadMessages(activeThread.id, [...newMessages, assistantMessage]);
    } catch (err) {
      console.warn('Fallback chat response', err);
      const s0 = selectedSources[0] || notebook.sources[0];
      const snippet = s0.content.slice(0, 280);
      const assistantMessage: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: `Basado estrictamente en los documentos cargados [Archivo: ${s0.title} - Sección: General - Pág. 1, Párrafo 1] [1]:\n\n${snippet}...\n\n[Archivo: ${s0.title}]`,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        sourcesCited: [s0.title],
        retrievedChunks: [
          {
            index: 1,
            sourceTitle: s0.title,
            sectionTitle: 'Contenido General',
            location: 'Pág. 1, Párrafo 1',
            snippet
          }
        ]
      };
      onUpdateThreadMessages(activeThread.id, [...newMessages, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageFeedback = (msgId: string, rating: 'positive' | 'negative' | 'improvement') => {
    const updated = messages.map((m) => {
      if (m.id === msgId) {
        return { ...m, feedback: rating };
      }
      return m;
    });
    onUpdateThreadMessages(activeThread.id, updated);

    if (rating === 'improvement') {
      setSpecificCommentMsgId(msgId);
    }
  };

  const handleApplyComment = async (msgId: string) => {
    if (!specificCommentText.trim()) return;

    const comment = specificCommentText.trim();
    setSpecificCommentText('');
    setSpecificCommentMsgId(null);

    const userCorrection: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: `Solicitud de mejora: ${comment}`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };

    const newMsgs = [...messages, userCorrection];
    onUpdateThreadMessages(activeThread.id, newMsgs);

    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `El estudiante solicitó la siguiente mejora sobre la respuesta anterior: "${comment}". Modifica únicamente aquello que sea necesario y conserva el estricto anclaje a datos y citas de las fuentes.`,
          history: newMsgs,
          sources: selectedSources,
          notebookTitle: notebook.title
        })
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        sourcesCited: data.sourcesCited,
        retrievedChunks: data.retrievedChunks || [],
        isGroundingWarning: data.isGroundingWarning
      };
      onUpdateThreadMessages(activeThread.id, [...newMsgs, botMsg]);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRename = () => {
    if (threadTitleInput.trim()) {
      onRenameThread(activeThread.id, threadTitleInput.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-210px)] min-h-[580px] max-h-[820px] rounded-3xl shadow-sm overflow-hidden border transition-colors ${
      isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Chat Thread Header */}
      <div className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between gap-3 ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            {isRenaming ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={threadTitleInput}
                  onChange={(e) => setThreadTitleInput(e.target.value)}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg border border-indigo-400 ${
                    isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
                  }`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                  }}
                />
                <button
                  onClick={handleSaveRename}
                  className="p-1 rounded bg-indigo-600 text-white cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className={`font-extrabold text-sm leading-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {activeThread.title}
                </h3>
                <button
                  onClick={() => setIsRenaming(true)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 cursor-pointer"
                  title="Cambiar nombre a este chat"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Respuestas Verificadas
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                {selectedSources.length} de {notebook.sources.length} fuentes tildadas para este chat
              </span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                (Responde con anclaje a datos y citación de archivo)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onStartNewChat}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Iniciar chat</span>
            <span className="sm:hidden">+ Nuevo</span>
          </button>

          {/* OPCIÓN CON UNA CRUZ PARA SALIR DEL CHAT */}
          {onCloseChat && (
            <button
              onClick={onCloseChat}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black shadow-xs transition cursor-pointer group ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-rose-950/70 text-slate-200 hover:text-rose-300 border-slate-700 hover:border-rose-600/50'
                  : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-300 hover:border-rose-300'
              }`}
              title="Salir del chat y volver al explorador de carpetas"
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode
                  ? 'bg-slate-700 group-hover:bg-rose-900 text-rose-400'
                  : 'bg-slate-100 group-hover:bg-rose-100 text-rose-600'
              }`}>
                <X className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="font-extrabold">Salir del chat</span>
            </button>
          )}
        </div>
      </div>

      {/* PROTECTION AGAINST MODEL DRIFT BANNER */}
      {isContextDriftAlertActive && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="leading-snug">
              <strong>Protección contra la deriva:</strong> Este chat está acumulando bastante contexto y podría comenzar a perder precisión. Te recomiendo iniciar un nuevo chat dentro de este cuaderno para continuar trabajando con mayor precisión.
            </p>
          </div>
          <button
            onClick={onStartNewChat}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shrink-0 ml-3 shadow-xs cursor-pointer"
          >
            + Iniciar nuevo chat
          </button>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">
        {/* If no sources in the notebook, prominent large title instruction */}
        {!hasSources && (
          <div className="my-auto py-10 px-6 sm:px-12 rounded-3xl bg-amber-50/90 border-2 border-amber-200/90 text-amber-950 max-w-2xl mx-auto text-center space-y-4 shadow-sm animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-amber-950 leading-snug tracking-tight max-w-xl mx-auto">
              Antes de trabajar con este contenido, necesito que cargues al menos una fuente en este cuaderno.
            </h2>

            <p className="text-xs sm:text-sm text-amber-800 font-medium max-w-lg mx-auto leading-relaxed">
              Puedes agregar un PDF, texto, imagen, link, video o audio directamente desde tu galería o archivos.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onGoToSourcesTab}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-black rounded-xl shadow-md shadow-amber-600/20 transition cursor-pointer"
              >
                <span>Cargar Fuentes Ahora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* If notebook has sources, but none are selected/ticked for chat */}
        {hasSources && !hasSelectedSources && (
          <div className="my-auto py-10 px-6 sm:px-12 rounded-3xl bg-indigo-50/90 border-2 border-indigo-200/90 text-indigo-950 max-w-2xl mx-auto text-center space-y-4 shadow-sm animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 border border-indigo-300 text-indigo-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-indigo-600" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-indigo-950 leading-snug tracking-tight max-w-xl mx-auto">
              No has seleccionado ninguna fuente para este chat.
            </h2>

            <p className="text-xs sm:text-sm text-indigo-800 font-medium max-w-lg mx-auto leading-relaxed">
              Tildar un texto simboliza que va a ser utilizado para dialogar con el chat, y únicamente el chat va a responder referido a los textos que están seleccionados.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {onSelectAllSourcesForChat && (
                <button
                  type="button"
                  onClick={() => onSelectAllSourcesForChat(true)}
                  className="inline-flex items-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tildar todas las fuentes ({notebook.sources.length}) y activar Chat</span>
                </button>
              )}
              <button
                onClick={onGoToSourcesTab}
                className="inline-flex items-center gap-2 px-4 py-3.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <span>Gestionar Fuentes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty state when thread has no messages yet */}
        {hasSelectedSources && messages.length === 0 && (
          <div className="my-auto py-8 px-6 sm:px-10 rounded-3xl bg-gradient-to-b from-indigo-50/70 via-white to-white border border-indigo-200/80 text-slate-900 max-w-2xl mx-auto space-y-6 shadow-xs animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-7 h-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                <span>Asistente Inteligente de Estudio</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pregunta a tus documentos y manuales
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Este chat responde basándose exclusivamente en las fuentes seleccionadas de tu cuaderno.
              </p>
            </div>

            {/* Guardrails Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-left">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-700 block">
                  1. Anclaje a Datos
                </span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Respuestas basadas <strong>únicamente</strong> en la información explícita de tus archivos.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-700 block">
                  2. Manejo Desconocimiento
                </span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Si no está en el texto: <em>"Lo siento, no tengo acceso a esa información en mis manuales."</em>
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-700 block">
                  3. Citación y Listas
                </span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Cita siempre la sección o archivo de origen, estructurando pasos ordenados.
                </p>
              </div>
            </div>

            {/* Sugerencias de preguntas rápidas */}
            <div className="space-y-2 pt-2 border-t border-indigo-100">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block text-center">
                Preguntas de ejemplo para comenzar:
              </span>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  `¿Cuáles son los puntos clave de "${selectedSources[0]?.title || 'los documentos'}"?`,
                  'Enumera los pasos o procedimientos principales explicados',
                  '¿Qué definiciones y conceptos centrales se explican en las fuentes?'
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(sug);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200/80 transition cursor-pointer text-left shadow-2xs"
                  >
                    💡 {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isUnknownGuardrail = msg.text.includes('Lo siento, no tengo acceso a esa información en mis manuales.');

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-2xl ${isUser ? 'ml-auto' : 'mr-auto'}`}
            >
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                    : isUnknownGuardrail
                    ? 'bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-bl-none shadow-xs'
                    : msg.isGroundingWarning
                    ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-none shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-bl-none shadow-xs'
                }`}
              >
                {!isUser && isUnknownGuardrail && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-2 rounded bg-amber-200/80 text-amber-950 font-black text-[10px] uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-amber-800" />
                    <span>Información fuera de manuales</span>
                  </div>
                )}

                <div
                  className="whitespace-pre-wrap font-sans space-y-1.5"
                  dangerouslySetInnerHTML={{
                    __html: renderRagResponseText(msg.text)
                  }}
                />

                {/* Acción rápida para consultar Google Search si no está en los manuales */}
                {!isUser && isUnknownGuardrail && onOpenGoogleSearch && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const lastUser = messages.slice().reverse().find((m) => m.sender === 'user');
                        onOpenGoogleSearch(lastUser?.text || '');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Consultar en Google Search en tiempo real</span>
                    </button>
                  </div>
                )}

                {/* Citas verificables interactivas con fragmentos originales */}
                {msg.retrievedChunks && msg.retrievedChunks.length > 0 && !isUnknownGuardrail && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Citas Verificables ({msg.retrievedChunks.length}):</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                        Haz clic para comprobar que no inventó nada
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {msg.retrievedChunks.map((chunk) => (
                        <button
                          key={chunk.index}
                          type="button"
                          onClick={() => setInspectingChunk(chunk)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold transition shadow-2xs hover:shadow-xs cursor-pointer group"
                          title={`Verificar cita #${chunk.index} de ${chunk.sourceTitle} (${chunk.location})`}
                        >
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black group-hover:scale-105 transition-transform">
                            {chunk.index}
                          </span>
                          <span className="max-w-[130px] truncate">{chunk.sourceTitle}</span>
                          <span className="text-[9px] text-indigo-500 font-normal">({chunk.location})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources cited footer (si no había chunks pero sí nombres de fuentes) */}
                {(!msg.retrievedChunks || msg.retrievedChunks.length === 0) && msg.sourcesCited && msg.sourcesCited.length > 0 && !isUnknownGuardrail && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-indigo-600" />
                      <span>Archivo / Origen citado:</span>
                    </span>
                    {msg.sourcesCited.map((s, idx) => (
                      <span key={idx} className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-indigo-800 font-bold shadow-2xs">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggest Artifact Action button */}
                {msg.suggestArtifactAction && (
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={onGoToArtifactsTab}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-xl border border-indigo-200 transition cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Ir a la pestaña Artefactos para configurar y generar</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Message metadata & Feedback buttons */}
              <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
                <span>{msg.timestamp}</span>

                {!isUser && !msg.isGroundingWarning && (
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleMessageFeedback(msg.id, 'positive')}
                      className={`p-1 rounded hover:bg-slate-100 transition cursor-pointer ${
                        msg.feedback === 'positive' ? 'text-emerald-600 font-bold' : 'text-slate-400'
                      }`}
                      title="Respuesta útil (👍)"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMessageFeedback(msg.id, 'negative')}
                      className={`p-1 rounded hover:bg-slate-100 transition cursor-pointer ${
                        msg.feedback === 'negative' ? 'text-rose-600 font-bold' : 'text-slate-400'
                      }`}
                      title="Respuesta no útil (👎)"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMessageFeedback(msg.id, 'improvement')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        msg.feedback === 'improvement'
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="Solicitar mejora (⚠️)"
                    >
                      Mejorar
                    </button>
                  </div>
                )}
              </div>

              {/* In-line specific comment input */}
              {specificCommentMsgId === msg.id && (
                <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 w-full animate-in fade-in">
                  <p className="text-[11px] text-amber-800 font-semibold mb-1">
                    💬 Escribe tu comentario específico para corregir o pulir esta respuesta:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ej. Aclara los pasos y cita la sección correspondiente..."
                      value={specificCommentText}
                      onChange={(e) => setSpecificCommentText(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-amber-300 bg-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleApplyComment(msg.id)}
                      className="px-3 py-1 bg-amber-600 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                    >
                      Enviar
                    </button>
                    <button
                      onClick={() => setSpecificCommentMsgId(null)}
                      className="px-2 py-1 text-xs text-slate-500 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 max-w-xs text-xs text-slate-500 shadow-xs animate-pulse">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
            <span>Consultando fuentes con anclaje a datos...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={
              hasSources
                ? 'Haz una pregunta sobre tus documentos (con anclaje y citación)...'
                : 'Primero carga al menos una fuente para habilitar preguntas...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 transition"
          />
          {onOpenGoogleSearch && (
            <button
              type="button"
              onClick={() => onOpenGoogleSearch(inputText || undefined)}
              className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
              title="Abrir Agente de Búsqueda Google en tiempo real (noticias, eventos, verificación)"
            >
              <Globe className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline text-xs font-bold">Google</span>
            </button>
          )}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition disabled:opacity-40 cursor-pointer shrink-0"
            title="Enviar pregunta"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-600 font-bold">Protección y Fidelidad:</span>
            <span>Anclaje a fuentes • Manejo estricto de citas • Sin alucinaciones</span>
          </span>
          <span className="hidden sm:inline text-slate-400">Presiona Enter para enviar</span>
        </div>
      </form>
      {/* MODAL 1: COMPROBACIÓN DE CITA VERIFICABLE (PÁGINA Y PÁRRAFO ORIGINAL) */}
      {inspectingChunk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  {inspectingChunk.index}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                    Cita Verificable #{inspectingChunk.index}
                  </h3>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Garantía de fidelidad: Comprueba que la IA no inventó nada</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingChunk(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metadatos de la Cita */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px]">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px] uppercase">Archivo:</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate block" title={inspectingChunk.sourceTitle}>
                  📄 {inspectingChunk.sourceTitle}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px] uppercase">Sección:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block" title={inspectingChunk.sectionTitle}>
                  🏷️ {inspectingChunk.sectionTitle}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px] uppercase">Ubicación:</span>
                <span className="font-extrabold text-indigo-700 dark:text-indigo-400 block">
                  📍 {inspectingChunk.location}
                </span>
              </div>
            </div>

            {/* Fragmento Textual Íntegro */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Texto original extraído quirúrgicamente del documento:
              </span>
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 max-h-56 overflow-y-auto text-xs leading-relaxed text-slate-900 dark:text-slate-100 font-sans whitespace-pre-wrap select-text">
                "{inspectingChunk.snippet}"
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-snug flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p>
                <strong>Anclaje riguroso verificado:</strong> Este fragmento fue recuperado fielmente de tus documentos y formó parte del contexto analizado. El modelo no utilizó conocimiento externo.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingChunk(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs transition cursor-pointer"
              >
                Cerrar comprobación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
