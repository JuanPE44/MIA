import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Search,
  Newspaper,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  BookmarkPlus,
  RotateCcw,
  X,
  Send,
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { Notebook, SourceItem } from '../types';

export type SearchAgentMode = 'general' | 'news' | 'factcheck';

export interface GroundedSource {
  title: string;
  url: string;
  domain: string;
}

export interface SearchAgentMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  mode?: SearchAgentMode;
  verdict?: 'VERIFICADO_VERDADERO' | 'PARCIALMENTE_CIERTO' | 'FALSO_DESMENTIDO' | 'EN_DESARROLLO' | null;
  searchQueries?: string[];
  sources?: GroundedSource[];
  isRealTime?: boolean;
}

interface GoogleSearchAgentProps {
  isOpen: boolean;
  onClose: () => void;
  activeNotebook?: Notebook | null;
  onSaveSourceToNotebook?: (source: Partial<SourceItem>) => void;
  initialQuery?: string;
  initialMode?: SearchAgentMode;
}

export const GoogleSearchAgent: React.FC<GoogleSearchAgentProps> = ({
  isOpen,
  onClose,
  activeNotebook,
  onSaveSourceToNotebook,
  initialQuery,
  initialMode = 'general'
}) => {
  const [mode, setMode] = useState<SearchAgentMode>(initialMode);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedSourceUrls, setSavedSourceUrls] = useState<Set<string>>(new Set());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Conversation history in session
  const [messages, setMessages] = useState<SearchAgentMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('focused_google_search_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        text: `### 👋 ¡Hola! Soy tu Agente conectado a la Búsqueda de Google en tiempo real.\n\nPuedo ayudarte a:\n- 🌐 **Hablar sobre eventos actuales**: Tendencias globales, descubrimientos y sucesos en vivo.\n- 📰 **Citar noticias recientes**: Titulares, coberturas periodísticas y fuentes de prensa internacional.\n- 🔍 **Verificar información (Fact-Checking)**: Contrastar rumores, afirmaciones dudosas o estadísticas con las fuentes indexadas por Google.\n\nElige un modo arriba o escribe cualquier duda o afirmación que quieras verificar hoy.`,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        mode: 'general',
        searchQueries: ['Búsqueda de Google en tiempo real activa'],
        sources: [
          { title: 'Google Search & News', url: 'https://news.google.com', domain: 'news.google.com' }
        ],
        isRealTime: true
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem('focused_google_search_history', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Handle external query trigger
  useEffect(() => {
    if (initialQuery && isOpen) {
      setInput(initialQuery);
    }
  }, [initialQuery, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: SearchAgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      mode
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history payload for API
      const historyPayload = newMessages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload.slice(-8), // last turns for context
          mode
        })
      });

      if (!res.ok) {
        throw new Error(`Error en servidor: ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: SearchAgentMessage = {
        id: `agent-${Date.now()}`,
        role: 'assistant',
        text: data.reply || 'No se obtuvo respuesta de la Búsqueda de Google.',
        timestamp: data.verifiedAt || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        mode: data.mode || mode,
        verdict: data.verdict || null,
        searchQueries: data.searchQueries || [textToSend],
        sources: data.sources || [],
        isRealTime: true
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Error fetching search grounding:', err);
      const fallbackMsg: SearchAgentMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `### 🌐 Búsqueda de Google en Tiempo Real\n\nNo fue posible completar la consulta en vivo en este instante debido a un problema de conexión temporal.\n\nPuedes intentar reformular tu búsqueda o verificar tu conexión a la red.`,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        mode
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    const welcome: SearchAgentMessage = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      text: `Historial reiniciado. ¿Sobre qué evento actual, noticia reciente o tema a verificar te gustaría consultar a la Búsqueda de Google?`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      mode: 'general',
      isRealTime: true
    };
    setMessages([welcome]);
  };

  const handleSaveSource = (source: GroundedSource, snippetContext: string) => {
    if (!onSaveSourceToNotebook) return;

    onSaveSourceToNotebook({
      type: 'link',
      title: source.title || 'Noticia verificada con Google Search',
      sourceUrl: source.url,
      content: `FUENTE CITADA VÍA BÚSQUEDA DE GOOGLE EN TIEMPO REAL\n\nTitular: ${source.title}\nURL: ${source.url}\nDominio: ${source.domain}\nFecha de Consulta: ${new Date().toLocaleString('es-ES')}\n\nContexto y Cita Resumida:\n${snippetContext.slice(0, 500)}...`,
      wordCount: Math.round(snippetContext.split(/\s+/).length)
    });

    setSavedSourceUrls((prev) => new Set(prev).add(source.url));
    setSaveSuccessMsg(`¡Fuente "${source.title.slice(0, 30)}..." guardada en tu cuaderno actual!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Preset prompt chips according to current mode
  const presetChips: Record<SearchAgentMode, string[]> = {
    general: [
      '¿Cuáles son los avances más recientes en Inteligencia Artificial este año?',
      '¿Qué noticias hay sobre descubrimientos recientes en el espacio?',
      'Novedades y tendencias clave en metodologías de estudio universitario'
    ],
    news: [
      'Principales noticias tecnológicas y científicas de esta semana',
      'Últimas coberturas de prensa sobre economía global y startups',
      '¿Qué informan los medios hoy sobre energías renovables y cambio climático?'
    ],
    factcheck: [
      'Verificar: ¿Es cierto que el telescopio James Webb detectó señales biológicas?',
      'Fact-check: ¿Es verdad que la jornada laboral de 4 días redujo el estrés en Europa?',
      '¿Es real la noticia viral sobre un nuevo examen de ingreso universitario obligatorio?'
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[860px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center shadow-xs">
              <Globe className="w-6 h-6 text-sky-600 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5 text-slate-900">
                  <span>Búsqueda Google en Vivo</span>
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>En Tiempo Real</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Eventos actuales · Cobertura de prensa · Fact-Checking riguroso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleClearHistory}
              title="Reiniciar conversación"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Salir del chat"
              className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer font-bold text-xs border border-slate-200 hover:border-rose-200"
            >
              <X className="w-4 h-4 text-rose-500 stroke-[2.5]" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* ACTIVE CONTEXT & NOTIFICATION BANNER */}
        {saveSuccessMsg && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg(null)} className="cursor-pointer text-emerald-100 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MODE SELECTOR TABS */}
        <div className="bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              onClick={() => setMode('general')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'general'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Eventos Actuales</span>
            </button>

            <button
              onClick={() => setMode('news')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'news'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>Citar Noticias Recientes</span>
            </button>

            <button
              onClick={() => setMode('factcheck')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'factcheck'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verificar Información</span>
            </button>
          </div>

          {activeNotebook && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <span>Cuaderno activo:</span>
              <span className="font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md">
                {activeNotebook.title}
              </span>
            </div>
          )}
        </div>

        {/* CHAT MESSAGES BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <Search className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] space-y-3`}>
                  {/* MESSAGE CARD */}
                  <div
                    className={`rounded-3xl p-4 sm:p-5 shadow-xs transition-all ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-tl-xs'
                    }`}
                  >
                    {/* Header info for assistant */}
                    {!isUser && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                            <Globe className="w-3.5 h-3.5 text-sky-600" />
                            <span>Búsqueda de Google</span>
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {msg.timestamp}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {msg.mode && (
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {msg.mode === 'factcheck' ? 'Fact-Checking' : msg.mode === 'news' ? 'Noticias' : 'Actualidad'}
                            </span>
                          )}

                          <button
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            title="Copiar texto"
                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* FACT CHECK VERDICT BANNER (If present) */}
                    {!isUser && msg.verdict && (
                      <div
                        className={`mb-3 p-3 rounded-2xl flex items-center gap-2.5 font-black text-xs uppercase tracking-wider ${
                          msg.verdict === 'VERIFICADO_VERDADERO'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : msg.verdict === 'PARCIALMENTE_CIERTO'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : msg.verdict === 'FALSO_DESMENTIDO'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300'
                            : 'bg-sky-50 text-sky-800 border border-sky-300'
                        }`}
                      >
                        {msg.verdict === 'VERIFICADO_VERDADERO' && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                        {msg.verdict === 'PARCIALMENTE_CIERTO' && (
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        )}
                        {msg.verdict === 'FALSO_DESMENTIDO' && (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                        {msg.verdict === 'EN_DESARROLLO' && (
                          <Radio className="w-5 h-5 text-sky-600 shrink-0 animate-pulse" />
                        )}
                        <span>
                          {msg.verdict === 'VERIFICADO_VERDADERO' && 'Veredicto: Verificado y Confirmado por Fuentes'}
                          {msg.verdict === 'PARCIALMENTE_CIERTO' && 'Veredicto: Parcialmente Cierto / Matizado'}
                          {msg.verdict === 'FALSO_DESMENTIDO' && 'Veredicto: Desmentido / Información Falsa'}
                          {msg.verdict === 'EN_DESARROLLO' && 'Veredicto: Información en Pleno Desarrollo'}
                        </span>
                      </div>
                    )}

                    {/* MESSAGE TEXT CONTENT */}
                    <div
                      className={`text-sm leading-relaxed whitespace-pre-line ${
                        isUser ? 'text-white' : 'text-slate-800 prose-headings:font-bold'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* LIVE SEARCH QUERIES DISPLAY */}
                    {!isUser && msg.searchQueries && msg.searchQueries.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                          <Search className="w-3 h-3 text-indigo-500" />
                          <span>Consultado en Google:</span>
                        </span>
                        {msg.searchQueries.map((query, qIdx) => (
                          <span
                            key={qIdx}
                            className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold"
                          >
                            "{query}"
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SOURCES & CITATIONS SECTION (Interactive cards) */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="bg-white/80 border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                        <div className="flex items-center gap-1.5">
                          <Newspaper className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Fuentes Noticiosas y Enlaces Citados ({msg.sources.length})</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Indexado por Google</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.sources.map((src, sIdx) => {
                          const isAlreadySaved = savedSourceUrls.has(src.url);

                          return (
                            <div
                              key={sIdx}
                              className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex flex-col justify-between gap-2 transition group"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700">
                                  <Globe className="w-3 h-3 text-slate-400" />
                                  <span className="truncate">{src.domain}</span>
                                </div>
                                <h5 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                                  {src.title}
                                </h5>
                              </div>

                              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg transition"
                                >
                                  <span>Abrir Fuente</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>

                                {activeNotebook && onSaveSourceToNotebook && (
                                  <button
                                    onClick={() => handleSaveSource(src, msg.text)}
                                    disabled={isAlreadySaved}
                                    title={isAlreadySaved ? 'Ya guardado' : 'Importar como fuente a tu cuaderno'}
                                    className={`flex items-center justify-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${
                                      isAlreadySaved
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                    }`}
                                  >
                                    {isAlreadySaved ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>Guardado</span>
                                      </>
                                    ) : (
                                      <>
                                        <BookmarkPlus className="w-3 h-3 text-slate-500" />
                                        <span>Al Cuaderno</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* LOADING ANIMATION WITH REAL-TIME STEP PILLS */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in duration-200">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1 animate-spin">
                <Search className="w-4 h-4" />
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-xs p-4 shadow-xs space-y-2 max-w-md">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span className="text-xs font-bold text-slate-800">
                    Buscando en Google Search en tiempo real...
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500 pl-4 border-l-2 border-indigo-200">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Conectando con el índice global de Google</span>
                  </p>
                  <p className="flex items-center gap-1.5 animate-pulse text-indigo-600 font-semibold">
                    <Radio className="w-3 h-3" />
                    <span>Recuperando noticias, fuentes y citas verificadas</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* SUGGESTED PROMPTS BAR */}
        <div className="px-4 py-2 bg-slate-100/60 border-t border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Sugerencias:</span>
          </span>

          {presetChips[mode].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              disabled={isLoading}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 whitespace-nowrap transition cursor-pointer shadow-2xs shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* INPUT FOOTER FORM */}
        <footer className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-3.5 text-slate-400 flex items-center">
                {mode === 'factcheck' ? (
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                ) : mode === 'news' ? (
                  <Newspaper className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Search className="w-4 h-4 text-sky-600" />
                )}
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === 'factcheck'
                    ? 'Escribe la afirmación o rumor a verificar (ej. ¿Es cierto que...?)'
                    : mode === 'news'
                    ? 'Consulta las últimas noticias sobre un suceso o materia...'
                    : 'Pregunta sobre eventos actuales en tiempo real...'
                }
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-100 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-hidden transition"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 sm:px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Consultar Google</span>
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-sky-500" />
              <span>Grounding oficial de Google Search via Gemini 3.8 Flash</span>
            </span>
            <span className="hidden sm:inline">
              Presiona Enter para buscar · Respuestas fundamentadas en tiempo real
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
