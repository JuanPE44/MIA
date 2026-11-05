import React, { useState } from 'react';
import {
  User,
  School,
  BookMarked,
  Calendar,
  X,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Flame,
  Award,
  Clock,
  BookOpen,
  CheckCircle2,
  Zap,
  CreditCard,
  Mail,
  FileText
} from 'lucide-react';
import { StudentProfile, UserStudyStats } from '../types';
import juanAvatar from '../assets/images/juan_profile_avatar_1791724553271.jpg';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onUpdateProfile: (updated: StudentProfile) => void;
  onResetAllData: () => void;
  stats: UserStudyStats;
  username: string;
  notebooksCount: number;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onResetAllData,
  stats,
  username,
  notebooksCount
}) => {
  const [formData, setFormData] = useState<StudentProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan_cuenta' | 'datos_academicos'>('plan_cuenta');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const planBenefits = [
    { label: 'IA Gemini 2.5 & 3.8 Flash ilimitada', desc: 'Consultas profundas y respuestas grounded sin límite' },
    { label: 'Modo Focus Blindado Anti-Distracciones', desc: 'Bloqueo de atajos (Alt+Tab, Win+D) y control de concentración' },
    { label: 'Estudio con Podcasts de Voz y Audio', desc: 'Síntesis de voz y resúmenes auditivos interactivos' },
    { label: 'Generación de Flashcards y Cuestionarios', desc: 'Active recall y algoritmos de fijación de memoria espaciada' },
    { label: 'Búsqueda Google en Vivo en el Chat', desc: 'Grounding con eventos y fuentes actualizadas de la web' },
    { label: 'Almacenamiento Ilimitado de PDFs', desc: 'Extracción semántica y procesamiento de manuales extensos' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full overflow-hidden my-6">
        
        {/* HEADER CON FOTO DE PERFIL Y TÍTULO "PERFIL" */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-850 dark:to-indigo-950/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={juanAvatar}
                alt="Foto de perfil de Juan"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Cuenta en línea" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  PERFIL
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase tracking-wider">
                  Plan Pro
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {formData.name || username} &bull; Emanuel.Harkes@gmail.com
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS SELECTOR */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('plan_cuenta')}
            className={`pb-3 px-3 text-xs font-black transition cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'plan_cuenta'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Plan Actual & Estado de Cuenta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('datos_academicos')}
            className={`pb-3 px-3 text-xs font-black transition cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'datos_academicos'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Datos Académicos</span>
          </button>
        </div>

        {/* TAB 1: INFORMACIÓN DEL PLAN ACTUAL Y ESTADO DE LA CUENTA RESUMIDO */}
        {activeTab === 'plan_cuenta' && (
          <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
            {/* SECCIÓN 1: TU PLAN ACTUAL */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Tu Plan Actual
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Activo y al día
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-sky-500/10 border border-indigo-200 dark:border-indigo-800/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      Plan Universitario Pro
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Licencia académica institucional &bull; Acceso sin límites
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Renovación</span>
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">Diciembre 2026 (Anual)</span>
                  </div>
                </div>

                {/* Beneficios incluidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-indigo-100 dark:border-indigo-900/50">
                  {planBenefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white/70 dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-xs font-black text-slate-900 dark:text-white leading-tight">
                          {b.label}
                        </span>
                        <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                          {b.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: ESTADO DE TU CUENTA RESUMIDO */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Estado de tu Cuenta Resumido
              </h3>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
                {/* Datos de acceso y seguridad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">Usuario Activo</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">{formData.name || username}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-indigo-500" />
                      Correo Registrado
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-sm truncate block">Emanuel.Harkes@gmail.com</span>
                  </div>
                </div>

                {/* Métricas clave de estudio de la cuenta */}
                <div>
                  <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Métricas de Aprendizaje en la Cuenta
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
                      <span className="block text-base font-black text-slate-900 dark:text-white">{stats.totalFocusHours}h</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold">Estudio Total</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <Flame className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <span className="block text-base font-black text-slate-900 dark:text-white">{stats.currentStreakDays} días</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold">Racha Actual</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                      <span className="block text-base font-black text-slate-900 dark:text-white">{stats.xpPoints}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold">Puntos XP</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <BookOpen className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                      <span className="block text-base font-black text-slate-900 dark:text-white">{notebooksCount}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold">Cuadernos</span>
                    </div>
                  </div>
                </div>

                {/* Estado de seguridad blindado */}
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-900 dark:text-emerald-300">
                      Entorno Blindado Anti-Distracciones Habilitado
                    </span>
                  </div>
                  <span className="font-black text-emerald-700 dark:text-emerald-400 text-[11px]">Protegido</span>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Deseas restablecer los cuadernos y fuentes al estado de muestra original?')) {
                    onResetAllData();
                    onClose();
                  }
                }}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 transition cursor-pointer font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restablecer datos de prueba
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: DATOS ACADÉMICOS (FORMULARIO EDITABLE) */}
        {activeTab === 'datos_academicos' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Nombre completo del estudiante
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Carrera / Programa de Estudio
              </label>
              <input
                type="text"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Institución / Facultad
                </label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Período Académico
                </label>
                <input
                  type="text"
                  value={formData.academicTerm}
                  onChange={(e) => setFormData({ ...formData, academicTerm: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* Botones de guardado */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    Guardado
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
