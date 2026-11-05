import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Bot,
  User,
  X,
  Send,
  RotateCcw,
  Sparkles,
  Calendar,
  CheckCircle2,
  HelpCircle,
  Clock,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { Notebook, UserStudyStats, UserType } from '../types';

export interface SupportMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  reservation?: {
    id: string;
    type: string;
    subject: string;
    dateTime: string;
    hostOrRoom: string;
    student: string;
  } | null;
}

interface SupportAgentChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  username: string;
  userType: UserType;
  currentView: 'explorer' | 'workspace';
  activeNotebook: Notebook | null;
  activeSegment?: string;
  stats: UserStudyStats;
}

export const SupportAgentChatbot: React.FC<SupportAgentChatbotProps> = ({
  isOpen,
  onClose,
  onOpen,
  username,
  userType,
  currentView,
  activeNotebook,
  activeSegment = 'GENERAL',
  stats
}) => {
  const [messages, setMessages] = useState<SupportMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('support_agent_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        text: `¡Hola, ${username}! 👋 Soy tu **Agente de Soporte IA y Tutor Académico**.\n\nRecuerdo toda nuestra conversación para resolver problemas técnicos paso a paso o gestionar **reservas de múltiples pasos** (tutorías 1 a 1 y salas de estudio silenciosas o grupales).\n\n¿En qué puedo ayudarte hoy?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save to session storage whenever messages change
  useEffect(() => {
    try {
      sessionStorage.setItem('support_agent_chat_messages', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: SupportMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: newHistory.map((m) => ({
            role: m.role,
            text: m.text
          })),
          context: {
            username,
            userType,
            currentView,
            activeNotebook: activeNotebook
              ? {
                  id: activeNotebook.id,
                  title: activeNotebook.title,
                  subject: activeNotebook.subject,
                  category: activeNotebook.category,
                  sourcesCount: activeNotebook.sources.length,
                  artifactsCount: activeNotebook.artifacts.length
                }
              : null,
            activeSegment,
            stats
          }
        })
      });

      if (!res.ok) throw new Error('Error al conectar con el servidor de soporte');
      const data = await res.json();

      const botMessage: SupportMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: data.reply || 'He recibido tu consulta. ¿En qué más puedo orientarte?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reservation: data.reservation || null
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.warn('Error in support chat request:', err);
      const fallbackMsg: SupportMessage = {
        id: `bot-fallback-${Date.now()}`,
        role: 'assistant',
        text: `He recibido tu mensaje respecto a "${query}". Estoy aquí para acompañarte paso a paso. Si se trata de una reserva, dime qué fecha y horario te acomodan mejor. Si es un inconveniente técnico, detállame qué mensaje visualizas en pantalla para solucionarlo.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetConversation = () => {
    const initialWelcome: SupportMessage = {
      id: `msg-welcome-${Date.now()}`,
      role: 'assistant',
      text: `Historial reiniciado. ¡Hola de nuevo, ${username}! ¿Qué problema deseas resolver o qué reserva te gustaría realizar?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([initialWelcome]);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick suggestion chips
  const suggestions = [
    { label: '📅 Reservar tutoría 1 a 1', query: 'Quiero reservar una sesión de tutoría académica personalizada.' },
    { label: '🏢 Reservar sala de estudio', query: 'Deseo reservar una sala de estudio para concentrarme mañana.' },
    { label: '🔧 Problema al cargar un PDF', query: 'Tengo un problema: subí un archivo PDF y quiero saber cómo verificar que se haya leído bien.' },
    { label: '⏱️ ¿Cómo funciona el Focus mode?', query: '¿Cómo funciona el temporizador Pomodoro con Focus mode?' }
  ];

  return (
    <>
      {/* FLOATING ACTION BUTTON (SOLO BOTÓN REDONDO CON ICONO "?" EN BLANCO) */}
      {!isOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="fixed bottom-20 right-6 z-40 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/35 hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer border-2 border-white/20"
          title="Agente de Soporte y Ayuda"
          aria-label="Ayuda"
        >
          <HelpCircle className="w-6 h-6 text-white stroke-[2.5]" />
        </button>
      )}

      {/* SUPPORT AGENT WINDOW */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-2xl ${
            isMinimized
              ? 'bottom-6 right-6 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[460px] h-[85vh] sm:h-[620px] max-h-[720px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4'
          }`}
        >
          {/* HEADER */}
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 shrink-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 p-0.5 shadow-2xs flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                    Agente de Soporte IA
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span>Multiturno</span>
                  <span>•</span>
                  <span>Resolución & Reservas</span>
                  <span>•</span>
                  <span className="text-indigo-600 font-bold">Gemini 3.8 Flash</span>
                </p>
              </div>
            </div>

            {/* Header controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetConversation}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Reiniciar conversación"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title={isMinimized ? 'Maximizar' : 'Minimizar'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer font-bold text-xs"
                title="Salir del chat"
              >
                <X className="w-4 h-4 text-rose-500 stroke-[2.5]" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>

          {/* IF MINIMIZED */}
          {isMinimized && (
            <div
              onClick={() => setIsMinimized(false)}
              className="p-3 bg-slate-50 flex items-center justify-between text-xs text-slate-600 font-bold cursor-pointer hover:bg-slate-100 transition"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Conversación en curso ({messages.length} mensajes)</span>
              </div>
              <ChevronDown className="w-4 h-4 rotate-180" />
            </div>
          )}

          {/* IF EXPANDED (MAIN BODY) */}
          {!isMinimized && (
            <>
              {/* Context Awareness Bar */}
              <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-slate-500">Contexto:</span>
                  {currentView === 'workspace' && activeNotebook ? (
                    <span className="font-extrabold text-indigo-700 truncate bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                      📘 {activeNotebook.title} ({activeSegment})
                    </span>
                  ) : (
                    <span className="font-extrabold text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded-md">
                      📂 Explorador general
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold text-slate-500">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  <span>{stats.focusMinutesToday}m hoy</span>
                </div>
              </div>

              {/* MESSAGES SCROLLABLE THREAD */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Bot Avatar */}
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`max-w-[85%] space-y-2`}>
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs whitespace-pre-wrap ${
                            isUser
                              ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700 rounded-bl-xs'
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* RESERVATION CONFIRMATION CARD (IF APPLICABLE) */}
                        {msg.reservation && (
                          <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-2xl border-2 border-emerald-300 shadow-md space-y-3 animate-in fade-in">
                            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                              <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>¡Reserva Confirmada!</span>
                              </div>
                              <span className="text-[10px] font-mono font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md">
                                {msg.reservation.id}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-700">
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-semibold">Tipo:</span>
                                <span className="font-extrabold text-slate-900">{msg.reservation.type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-semibold">Materia / Tema:</span>
                                <span className="font-bold text-slate-800">{msg.reservation.subject}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-semibold">Horario:</span>
                                <span className="font-bold text-emerald-700">{msg.reservation.dateTime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-semibold">Asignación:</span>
                                <span className="font-bold text-indigo-700">{msg.reservation.hostOrRoom}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-semibold">Estudiante:</span>
                                <span className="font-bold text-slate-800">{msg.reservation.student}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                              <span className="text-[10px] text-slate-500">Registrada en calendario</span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(msg.reservation!.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition cursor-pointer"
                              >
                                {copiedId === msg.reservation.id ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copiar Código</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        <div
                          className={`text-[10px] text-slate-400 px-1 ${
                            isUser ? 'text-right' : 'text-left'
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold animate-pulse pl-9">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Soporte IA procesando tu solicitud con Gemini...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK SUGGESTIONS PILLS */}
              <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 pl-1">
                  Atajos:
                </span>
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(sug.query)}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 text-[11px] font-semibold whitespace-nowrap border border-slate-200/80 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>

              {/* INPUT BAR */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe tu duda, problema o reserva..."
                    disabled={isLoading}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    title="Enviar mensaje"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1.5">
                  <span>Presiona Enter para enviar</span>
                  <span className="text-indigo-600 font-bold">Historial multiturno activo</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
