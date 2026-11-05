import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Headphones,
  FileText,
  BookOpen,
  CheckCircle2,
  Layers,
  Sun,
  Moon
} from 'lucide-react';
import { UserType } from '../types';
import juanAvatar from '../assets/images/juan_profile_avatar_1791724553271.jpg';

interface LoginScreenProps {
  onLoginSuccess: (username: string, userType: UserType) => void;
  isDarkMode?: boolean;
  onToggleTheme?: (dark: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  isDarkMode = false,
  onToggleTheme
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Direct access for Juan into his modeled study workspace
      onLoginSuccess('Juan', 'frecuente');
    }, 250);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between p-4 sm:p-8 selection:bg-indigo-600 selection:text-white transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
    }`}>
      {/* Top Header: Logo in left corner + MIA text + Theme Switcher on right */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pt-2">
        {/* Left corner: Logo and MIA / Mi Inteligencia Artificial (Enlarged) */}
        <div className="flex items-center gap-4">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-11-05_at_8.03.54_AM_cb87d5b4.jpeg"
            alt="Logo MIA"
            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-3xl shadow-xl border-2 border-slate-300/60 dark:border-slate-700 shrink-0"
          />
          <div className="text-left">
            <span className={`block font-black text-3xl sm:text-4xl tracking-tight leading-none ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              MIA
            </span>
            <span className={`block text-xs sm:text-sm font-bold mt-1.5 leading-tight ${
              isDarkMode ? 'text-slate-300' : 'text-slate-500'
            }`}>
              Mi Inteligencia Artificial
            </span>
          </div>
        </div>

        {/* Right corner: Option to change to Blanco or Negro */}
        <div className={`inline-flex items-center p-1 rounded-2xl border transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => onToggleTheme?.(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              !isDarkMode
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Cambiar a Modo Blanco"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Blanco</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleTheme?.(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Cambiar a Modo Negro"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Negro</span>
          </button>
        </div>
      </header>

      {/* Main Center Area: Profile Bubble + Greeting + Empezar Button */}
      <main className="max-w-md w-full mx-auto my-auto py-6">
        <div className={`rounded-3xl p-8 sm:p-10 shadow-xl text-center transition-all border ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 shadow-slate-950/50'
            : 'bg-white border-slate-200/90 shadow-slate-200/50'
        }`}>
          {/* Globito de perfil del usuario con foto */}
          <div className="relative mx-auto w-32 h-32 sm:w-36 sm:h-36 mb-6">
            <div className="w-full h-full rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-sky-400 to-indigo-600 shadow-xl shadow-indigo-500/20">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-2 border-white">
                <img
                  src={juanAvatar}
                  alt="Foto de perfil de Juan"
                  className="w-full h-full object-cover select-none"
                  onError={(e) => {
                    e.currentTarget.src = '/src/assets/images/hero_students_1791070277154.jpg';
                  }}
                />
              </div>
            </div>

            {/* Status badge on the avatar bubble */}
            <div
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-500 border-3 border-white flex items-center justify-center text-white shadow-md"
              title="Estudiante activo"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            </div>
          </div>

          {/* Saludo personalizado */}
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            ¡Bienvenido de nuevo Juan!
          </h1>
          <p className={`text-xs sm:text-sm mt-2 font-medium max-w-xs mx-auto leading-relaxed ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Tus materias, resúmenes y métodos de estudio están listos para continuar.
          </p>

          {/* Botón Empezar */}
          <button
            type="button"
            onClick={handleStart}
            disabled={isLoading}
            className="w-full mt-7 py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-base shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75 group"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Ingresando a tus carpetas...</span>
              </>
            ) : (
              <>
                <span>Empezar</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 mt-3 font-medium">
            Acceso directo a tus carpetas, apuntes y cuadernos de estudio
          </p>
        </div>
      </main>

      {/* Bottom Section: Mensaje destacado */}
      <footer className="max-w-2xl w-full mx-auto pb-4 pt-2">
        <div className={`rounded-3xl border p-5 sm:p-6 text-center shadow-xs space-y-3 transition-colors ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800 text-white'
            : 'bg-indigo-50/70 border-indigo-100 text-slate-900'
        }`}>
          {/* Emblema de la aplicación */}
          <div className="flex items-center justify-center gap-2">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400' : 'bg-white border-indigo-200 text-indigo-600'
            }`}>
              <Headphones className="w-4 h-4" />
            </div>
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-white border-indigo-200 text-emerald-600'
            }`}>
              <Layers className="w-4 h-4" />
            </div>
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-white border-indigo-200 text-amber-600'
            }`}>
              <BookOpen className="w-4 h-4" />
            </div>
          </div>

          <p className={`text-xs sm:text-sm font-extrabold leading-relaxed max-w-xl mx-auto ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            “Desde tener tus resúmenes como podcasts hasta flashcards y cuestionarios interactivos, esta aplicación lo tiene todo. Esperamos que la disfrutes.”
          </p>

          <div className={`flex items-center justify-center gap-3 text-[11px] font-bold pt-1 ${
            isDarkMode ? 'text-indigo-300' : 'text-slate-800'
          }`}>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Podcasts con Voz
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Flashcards
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Cuestionarios Interactivos
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
