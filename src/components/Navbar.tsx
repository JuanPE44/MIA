import React, { useState } from 'react';
import {
  BrainCircuit,
  MessageSquare,
  FileText,
  Sparkles,
  Clock,
  LogOut,
  FolderOpen,
  ArrowLeft,
  Flame,
  Zap,
  BookOpen,
  Bot,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { MainSegment, Notebook, UserStudyStats, UserType } from '../types';

interface NavbarProps {
  currentView: 'explorer' | 'workspace';
  onBackToExplorer: () => void;
  activeSegment: MainSegment;
  onSelectSegment: (segment: MainSegment) => void;
  activeNotebook: Notebook | null;
  onLogout: () => void;
  username: string;
  userType: UserType;
  stats: UserStudyStats;
  onOpenSupport?: () => void;
  onOpenSearch?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: (dark: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onBackToExplorer,
  activeSegment,
  onSelectSegment,
  activeNotebook,
  onLogout,
  username,
  userType,
  stats,
  onOpenSupport,
  onOpenSearch,
  isDarkMode = false,
  onToggleTheme
}) => {
  const segments: { id: MainSegment; label: string; icon: any; count?: number | string | null }[] = [
    {
      id: 'CHAT',
      label: 'CHAT',
      icon: MessageSquare,
      count: activeNotebook ? `${activeNotebook.chatThreads?.length || 1}` : null
    },
    {
      id: 'FUENTES',
      label: 'FUENTES',
      icon: FileText,
      count: activeNotebook ? `${activeNotebook.sources.length}` : '0'
    },
    {
      id: 'ARTEFACTOS',
      label: 'ARTEFACTOS',
      icon: Sparkles,
      count: activeNotebook ? `${activeNotebook.artifacts.length}` : '0'
    },
    {
      id: 'ESTUDIO',
      label: 'ESTUDIO',
      icon: Clock,
      count: null
    }
  ];

  return (
    <header className={`sticky top-0 z-40 border-b shadow-xs transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo in left corner with MIA and Mi Inteligencia Artificial, plus navigation */}
          <div className="flex items-center gap-3">
            {/* Logo in top-left corner - Nothing covers it */}
            <div className="flex items-center gap-2.5 shrink-0">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-11-05_at_8.03.54_AM_cb87d5b4.jpeg"
                alt="Logo MIA"
                className="w-10 h-10 object-cover rounded-xl shadow-xs border border-slate-300/40 dark:border-slate-700 shrink-0"
              />
              <div className="text-left">
                <span className={`block font-black text-xl tracking-tight leading-none ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  MIA
                </span>
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-tight whitespace-nowrap">
                  Mi Inteligencia Artificial
                </span>
              </div>
            </div>

            {/* If in workspace, show Mis Carpetas button and active notebook indicator */}
            {currentView === 'workspace' && (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
                <button
                  onClick={onBackToExplorer}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDarkMode
                      ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Volver a la vista de carpetas y cuadernos"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Mis Carpetas</span>
                </button>

                {activeNotebook && (
                  <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 text-white border border-slate-800 shadow-sm max-w-[200px] truncate">
                    <span className="text-sm select-none">{activeNotebook.icon || '📘'}</span>
                    <span className="text-xs font-black text-white block truncate tracking-tight">
                      {activeNotebook.title}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Metrics, Blanco/Negro switcher & Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Blanco / Negro Option */}
            <div className={`inline-flex items-center p-0.5 rounded-xl border transition-colors ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => onToggleTheme?.(false)}
                title="Cambiar a Modo Blanco"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  !isDarkMode
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Blanco</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleTheme?.(true)}
                title="Cambiar a Modo Negro"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-700 text-white shadow-2xs border border-slate-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Negro</span>
              </button>
            </div>

            {/* Quick Google Search Agent button (Real-time grounding) */}
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs group ${
                  isDarkMode
                    ? 'bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200'
                }`}
                title="Conectar a la Búsqueda de Google en tiempo real (Noticias, eventos actuales y fact-checking)"
              >
                <Globe className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden xl:inline">Google Search</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            )}

            {/* Quick Support Agent IA button */}
            {onOpenSupport && (
              <button
                type="button"
                onClick={onOpenSupport}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                  isDarkMode
                    ? 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
                title="Abrir Agente de Soporte IA y Reservas"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xl:inline">Soporte IA</span>
              </button>
            )}

            {/* Streak & Focus */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold border ${
                  isDarkMode ? 'bg-amber-950/50 border-amber-800/80 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
                title="Racha de estudio activa"
              >
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{stats.currentStreakDays}d</span>
              </div>
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold border ${
                  isDarkMode ? 'bg-indigo-950/50 border-indigo-800/80 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                }`}
                title="Minutos de concentración hoy"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{stats.focusMinutesToday}m</span>
              </div>
            </div>

            {/* User Badge & Salir Button */}
            <div className={`flex items-center gap-2 pl-2 border-l ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`hidden sm:inline-block text-xs font-black px-2.5 py-1 rounded-xl border ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}>
                {username}
              </span>
              <button
                type="button"
                onClick={onLogout}
                title="Salir de la aplicación"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer border shadow-2xs ${
                  isDarkMode
                    ? 'bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 hover:text-white border-rose-800/80'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border-rose-200'
                }`}
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 SEGMENTS TABS: Shown when inside a notebook! */}
        {currentView === 'workspace' && (
          <div className={`flex items-center justify-between sm:justify-start gap-1 sm:gap-2 py-2.5 border-t overflow-x-auto scrollbar-none animate-in fade-in ${
            isDarkMode ? 'border-slate-800' : 'border-slate-100'
          }`}>
            {segments.map((seg) => {
              const Icon = seg.icon;
              const isActive = activeSegment === seg.id;
              return (
                <button
                  key={seg.id}
                  onClick={() => onSelectSegment(seg.id)}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-black tracking-wide transition select-none cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 ring-2 ring-indigo-600/20'
                      : isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span>{seg.label}</span>
                  {seg.count !== null && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {seg.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
