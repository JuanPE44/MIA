import React, { useState, useEffect, useRef } from 'react';
import {
  Folder as FolderIcon,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  FileText,
  CheckCircle2,
  Layers,
  Search,
  MoveRight,
  FolderInput,
  FolderOutput,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { Notebook, Folder } from '../types';
import bannerEmprendimiento from '../assets/images/folder_emprendimiento_banner_1791726610840.jpg';
import bannerCuatrimestre from '../assets/images/folder_cuatrimestre_banner_1791726628989.jpg';

const getFolderBanner = (folder: Folder) => {
  if (folder.coverImage) return folder.coverImage;
  const lower = folder.name.toLowerCase();
  if (lower.includes('emprend') || lower.includes('negocio') || lower.includes('startup')) {
    return bannerEmprendimiento;
  }
  return bannerCuatrimestre;
};

const getFolderTagline = (folder: Folder) => {
  const lower = folder.name.toLowerCase();
  if (lower.includes('emprend') || lower.includes('negocio') || lower.includes('startup')) {
    return 'Ecosistema de innovación, Lean Startup, Business Model Canvas y validación ágil';
  }
  if (lower.includes('cuatrimestre') || lower.includes('semestre') || lower.includes('2026')) {
    return 'Planificación académica, asignaturas del ciclo lectivo 2026 y apuntes de cursada';
  }
  return `Espacio temático de estudio · Creada el ${folder.createdAt}`;
};

interface NotebooksExplorerProps {
  folders: Folder[];
  notebooks: Notebook[];
  onOpenNotebook: (notebookId: string) => void;
  onCreateNotebook: (newNb: Partial<Notebook>) => void;
  onDeleteNotebook: (notebookId: string) => void;
  onCreateFolder: (name: string, color: string, icon: string, coverImage?: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveNotebook: (notebookId: string, folderId: string | null) => void;
  userType: 'frecuente' | 'nuevo';
  isDarkMode?: boolean;
}

const FOLDER_ICONS = ['📁', '💼', '📚', '🎓', '🔬', '🚀', '💡', '📊', '🏛️', '🧪', '⚖️', '🎨'];
const NOTEBOOK_ICONS = ['📘', '🚀', '💡', '🧠', '📊', '📝', '🔬', '🎓', '💻', '⚡', '🎯', '📌'];

export const NotebooksExplorer: React.FC<NotebooksExplorerProps> = ({
  folders,
  notebooks,
  onOpenNotebook,
  onCreateNotebook,
  onDeleteNotebook,
  onCreateFolder,
  onDeleteFolder,
  onMoveNotebook,
  userType,
  isDarkMode = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // New Folder Form
  const [folderName, setFolderName] = useState('');
  const [folderIcon, setFolderIcon] = useState('📁');
  const [folderColor, setFolderColor] = useState('indigo');

  // New Notebook Form
  const [notebookTitle, setNotebookTitle] = useState('');
  const [notebookIcon, setNotebookIcon] = useState('📘');
  const [notebookSubject, setNotebookSubject] = useState('');
  const [notebookDescription, setNotebookDescription] = useState('');
  const [notebookFolderId, setNotebookFolderId] = useState<string>('');

  // Context Menu (Right Click) State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    notebook: Notebook;
  } | null>(null);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent, nb: Notebook) => {
    e.preventDefault();
    e.stopPropagation();

    // Ensure menu stays within window boundaries
    const x = Math.min(e.clientX, window.innerWidth - 240);
    const y = Math.min(e.clientY, window.innerHeight - 280);

    setContextMenu({ x, y, notebook: nb });
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    const lower = folderName.trim().toLowerCase();
    const assignedBanner = lower.includes('emprend') || lower.includes('negocio') || lower.includes('startup')
      ? bannerEmprendimiento
      : bannerCuatrimestre;
    onCreateFolder(folderName.trim(), folderColor, folderIcon, assignedBanner);
    setFolderName('');
    setFolderIcon('📁');
    setIsCreatingFolder(false);
  };

  const handleCreateNotebookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notebookTitle.trim()) return;

    onCreateNotebook({
      title: notebookTitle.trim(),
      icon: notebookIcon,
      subject: notebookSubject.trim() || 'General',
      description: notebookDescription.trim() || 'Cuaderno de estudio temático.',
      category: 'emprendimiento',
      color: 'indigo',
      folderId: notebookFolderId ? notebookFolderId : null,
      sources: [],
      analysis: null,
      artifacts: [],
      chatMessages: []
    });

    setNotebookTitle('');
    setNotebookIcon('📘');
    setNotebookSubject('');
    setNotebookDescription('');
    setNotebookFolderId('');
    setIsCreatingNotebook(false);
  };

  // Filter notebooks by search
  const filteredNotebooks = notebooks.filter((nb) => {
    const q = searchQuery.toLowerCase();
    return (
      nb.title.toLowerCase().includes(q) ||
      nb.subject.toLowerCase().includes(q) ||
      nb.description.toLowerCase().includes(q)
    );
  });

  // Loose notebooks: notebooks where folderId is null or not found
  const looseNotebooks = filteredNotebooks.filter((nb) => !nb.folderId || !folders.some(f => f.id === nb.folderId));

  const totalSourcesCount = notebooks.reduce((acc, nb) => acc + nb.sources.length, 0);

  return (
    <div className="space-y-7 pb-16">
      {/* Top Banner & Action Controls - Inverted dark background with white text */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle decorative glow in background */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wide mb-2.5 backdrop-blur-xs">
            <span>Explorador de Estudio</span>
            <span className="text-slate-500">·</span>
            <span className="capitalize">{userType === 'frecuente' ? 'Perfil Frecuente (Modelado)' : 'Perfil Nuevo (Desde cero)'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Carpetas y Cuadernos de Estudio
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
            Organiza tus materias en carpetas o gestiona cuadernos sueltos. Haz <strong className="text-white">clic</strong> para abrir un cuaderno (sus 4 secciones), o <strong className="text-white">clic derecho</strong> para moverlo o sacarlo de una carpeta.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition shadow-sm cursor-pointer backdrop-blur-xs"
          >
            <FolderIcon className="w-4 h-4 text-indigo-300" />
            <span>+ Nueva Carpeta</span>
          </button>

          <button
            onClick={() => setIsCreatingNotebook(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Cuaderno</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar carpetas o cuadernos por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        <div className={`text-xs font-black hidden sm:block ${
          isDarkMode ? 'text-white' : 'text-slate-600'
        }`}>
          {folders.length} {folders.length === 1 ? 'carpeta' : 'carpetas'} · {notebooks.length} {notebooks.length === 1 ? 'cuaderno' : 'cuadernos'} ({totalSourcesCount} fuentes totales)
        </div>
      </div>

      {/* EMPTY STATE FOR USUARIO NUEVO */}
      {folders.length === 0 && notebooks.length === 0 && (
        <div className={`rounded-3xl border-2 border-dashed p-12 text-center max-w-xl mx-auto space-y-4 my-8 animate-in fade-in ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto shadow-md border border-slate-700 overflow-hidden">
            <img src="/assets/aistudio/WhatsApp_Image_2026-11-05_at_8.03.54_AM_cb87d5b4.jpeg" alt="Logo" className="w-16 h-16 object-cover" />
          </div>
          <div>
            <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              ¡Bienvenido a tu Espacio de Estudio!
            </h3>
            <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mi Inteligencia Artificial</p>
            <p className={`text-xs max-w-md mx-auto mt-1 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
              Has iniciado sesión como <strong>Usuario nuevo</strong>. Tu espacio inteligente está listo para empezar. Crea tu primera carpeta temática o un cuaderno de estudio.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsCreatingFolder(true)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 border font-bold text-xs rounded-xl shadow-xs cursor-pointer ${
                isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span>Crear Primera Carpeta</span>
            </button>
            <button
              onClick={() => setIsCreatingNotebook(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primer Cuaderno</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: CARPETAS (FOLDERS) */}
      {folders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-black text-base flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              <FolderIcon className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <span className={`font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Carpetas ({folders.length})
              </span>
            </h3>
            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-400'}`}>
              Contenedores temáticos de cuadernos
            </span>
          </div>

          <div className="space-y-6">
            {folders.map((folder) => {
              const containedNotebooks = filteredNotebooks.filter((nb) => nb.folderId === folder.id);
              const folderBanner = getFolderBanner(folder);
              const folderTagline = getFolderTagline(folder);

              return (
                <div
                  key={folder.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  {/* IMAGEN A LO LARGO (WIDE PANORAMIC FOLDER BANNER) */}
                  <div className="relative w-full h-44 sm:h-52 md:h-56 overflow-hidden group select-none">
                    <img
                      src={folderBanner}
                      alt={folder.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = bannerCuatrimestre;
                      }}
                    />

                    {/* Gradient overlay to guarantee high-contrast legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/15" />

                    {/* Top floating row: Icon & badge on left, actions on right */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-xl select-none">
                          {folder.icon || '📁'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider border border-white/30 shadow-xs">
                          {containedNotebooks.length} {containedNotebooks.length === 1 ? 'cuaderno' : 'cuadernos'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setNotebookFolderId(folder.id);
                            setIsCreatingNotebook(true);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-white/95 hover:bg-white shadow-md backdrop-blur-md transition cursor-pointer"
                          title="Agregar cuaderno dentro de esta carpeta"
                        >
                          <Plus className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="hidden sm:inline">Agregar Cuaderno</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar la carpeta "${folder.name}"? Los cuadernos se conservarán como cuadernos sueltos.`)) {
                              onDeleteFolder(folder.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-black/40 hover:bg-rose-600 text-white/90 hover:text-white backdrop-blur-md transition cursor-pointer"
                          title="Eliminar carpeta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom title & domain tagline inside the panoramic banner */}
                    <div className="absolute bottom-4 left-5 right-5 text-white">
                      <h4 className="font-black text-2xl sm:text-3xl text-white tracking-tight drop-shadow-md">
                        {folder.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1 drop-shadow-sm line-clamp-1">
                        {folderTagline}
                      </p>
                    </div>
                  </div>

                  {/* Body: Notebooks inside this folder */}
                  <div className="p-5 sm:p-6 bg-white dark:bg-slate-900/95 flex-1">
                    {containedNotebooks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {containedNotebooks.map((nb) => (
                          <div
                            key={nb.id}
                            onClick={() => onOpenNotebook(nb.id)}
                            onContextMenu={(e) => handleContextMenu(e, nb)}
                            className="group relative p-4 rounded-2xl bg-slate-50/70 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xl select-none">{nb.icon || '📘'}</span>
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200">
                                  {nb.subject}
                                </span>
                              </div>

                              <h5 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2">
                                {nb.title}
                              </h5>
                              <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                {nb.description}
                              </p>
                            </div>

                            <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                {nb.sources.length > 0 ? (
                                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                    {nb.sources.length} {nb.sources.length === 1 ? 'fuente' : 'fuentes'}
                                  </span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400 font-bold">Sin fuentes</span>
                                )}
                              </span>

                              <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-0.5 transition">
                                <span>Abrir</span>
                                <MoveRight className="w-3 h-3" />
                              </span>
                            </div>

                            <div className="mt-1 text-[9px] text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition text-right">
                              Clic derecho para mover
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Esta carpeta de <strong className="dark:text-white">{folder.name}</strong> está lista para tus cuadernos y fuentes de estudio.
                        </p>
                        <button
                          onClick={() => {
                            setNotebookFolderId(folder.id);
                            setIsCreatingNotebook(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Crear Primer Cuaderno en esta Carpeta</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: CUADERNOS SUELTOS (LOOSE NOTEBOOKS - Only visible if loose notebooks exist) */}
      {looseNotebooks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-black text-base flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              <BookOpen className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <span className={`font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Cuadernos Sueltos ({looseNotebooks.length})
              </span>
            </h3>
            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-400'}`}>
              Cuadernos fuera de carpetas (clic derecho para meter a carpeta)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {looseNotebooks.map((nb) => (
              <div
                key={nb.id}
                onClick={() => onOpenNotebook(nb.id)}
                onContextMenu={(e) => handleContextMenu(e, nb)}
                className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl select-none">{nb.icon || '📘'}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        {nb.subject}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleContextMenu(e, nb)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Opciones de cuaderno"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-black text-slate-900 dark:text-white text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2">
                    {nb.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {nb.description}
                  </p>
                </div>

                <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {nb.sources.length > 0 ? (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        {nb.sources.length} {nb.sources.length === 1 ? 'fuente' : 'fuentes'}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        Sin fuentes
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-0.5 transition">
                    <span>Abrir Cuaderno</span>
                    <MoveRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="mt-1 text-[9px] text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition text-right">
                  Clic derecho para meter a carpeta
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTEXT MENU (RIGHT CLICK) */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 w-64 text-xs animate-in fade-in"
        >
          {/* Header */}
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-base select-none">{contextMenu.notebook.icon || '📘'}</span>
            <span className="truncate">{contextMenu.notebook.title}</span>
          </div>

          {/* Action 1: Open Notebook */}
          <button
            onClick={() => {
              onOpenNotebook(contextMenu.notebook.id);
              setContextMenu(null);
            }}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Abrir Cuaderno (4 Secciones)</span>
          </button>

          {/* Action 2: Move into folder */}
          <div className="px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-1">
            Organizar en Carpeta
          </div>

          {folders.length > 0 ? (
            <div className="max-h-40 overflow-y-auto">
              {folders.map((f) => {
                const isCurrentFolder = contextMenu.notebook.folderId === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      onMoveNotebook(contextMenu.notebook.id, f.id);
                      setContextMenu(null);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between text-xs cursor-pointer ${
                      isCurrentFolder
                        ? 'text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50/50 dark:bg-indigo-950/60'
                        : 'text-slate-900 dark:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{f.icon || '📁'}</span>
                      <span className="truncate">{f.name}</span>
                    </span>
                    {isCurrentFolder && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3.5 py-1.5 text-slate-400 dark:text-slate-500 text-[11px] italic">
              No hay carpetas creadas aún
            </div>
          )}

          {/* Action 3: Remove from folder (Leave loose) */}
          {contextMenu.notebook.folderId && (
            <button
              onClick={() => {
                onMoveNotebook(contextMenu.notebook.id, null);
                setContextMenu(null);
              }}
              className="w-full text-left px-3.5 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold border-t border-slate-100 dark:border-slate-800 mt-1 cursor-pointer"
            >
              <FolderOutput className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Sacar de carpeta (dejar suelto)</span>
            </button>
          )}

          {/* Action 4: Delete */}
          <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
            <button
              onClick={() => {
                if (confirm(`¿Eliminar el cuaderno "${contextMenu.notebook.title}"?`)) {
                  onDeleteNotebook(contextMenu.notebook.id);
                  setContextMenu(null);
                }
              }}
              className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar Cuaderno</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CREATE FOLDER (CON NOMBRE E ÍCONO) */}
      {isCreatingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6">
            <h3 className="font-black text-slate-900 dark:text-white text-lg mb-1 flex items-center gap-2">
              <span className="text-2xl">{folderIcon}</span>
              <span>Nueva Carpeta de Estudio</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">
              Personaliza el nombre e ícono de la carpeta contenedora.
            </p>

            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase mb-1.5">
                  Nombre de la Carpeta *
                </label>
                <input
                  type="text"
                  placeholder="ej. 1er Cuatrimestre, Finales de Economía..."
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                  autoFocus
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase mb-1.5">
                  Selecciona un Ícono
                </label>
                <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  {FOLDER_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFolderIcon(icon)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition cursor-pointer border ${
                        folderIcon === icon
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-110'
                          : 'bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Crear Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NOTEBOOK (CON NOMBRE E ÍCONO) */}
      {isCreatingNotebook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6">
            <h3 className="font-black text-slate-900 dark:text-white text-lg mb-1 flex items-center gap-2">
              <span className="text-2xl">{notebookIcon}</span>
              <span>Crear Nuevo Cuaderno</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">
              Configura el nombre, ícono y carpeta destino de tu cuaderno.
            </p>

            <form onSubmit={handleCreateNotebookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase mb-1.5">
                  Nombre del Cuaderno *
                </label>
                <input
                  type="text"
                  placeholder="ej. Lean Startup, Biología Celular, Contabilidad..."
                  value={notebookTitle}
                  onChange={(e) => setNotebookTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                  autoFocus
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase mb-1.5">
                  Selecciona un Ícono
                </label>
                <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  {NOTEBOOK_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNotebookIcon(icon)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition cursor-pointer border ${
                        notebookIcon === icon
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-110'
                          : 'bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase mb-1">
                    Materia / Asignatura
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Administración, Economía..."
                    value={notebookSubject}
                    onChange={(e) => setNotebookSubject(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase mb-1">
                    Carpeta contenedora
                  </label>
                  <select
                    value={notebookFolderId}
                    onChange={(e) => setNotebookFolderId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      (Dejar como Cuaderno suelto)
                    </option>
                    {folders.map((f) => (
                      <option
                        key={f.id}
                        value={f.id}
                        className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {f.icon || '📁'} {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase mb-1">
                  Descripción u Objetivo
                </label>
                <textarea
                  rows={2}
                  placeholder="Objetivo o temario a cubrir..."
                  value={notebookDescription}
                  onChange={(e) => setNotebookDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingNotebook(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Crear Cuaderno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
