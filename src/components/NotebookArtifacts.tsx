import React, { useState, useEffect } from 'react';
import {
  FileText,
  HelpCircle,
  Layers,
  BookOpen,
  Headphones,
  Sliders,
  Sparkles,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Award,
  SlidersHorizontal,
  X,
  Film,
  Trash2,
  Eye,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck
} from 'lucide-react';
import {
  Notebook,
  StudyArtifact,
  ArtifactType,
  ArtifactPersonalization
} from '../types';
import { PodcastSpeaker } from '../services/audioSynthesizer';

export const AUTHOR_COLORS = [
  { id: 'amber', label: 'Amarillo', bg: 'bg-amber-300', text: 'text-amber-950', ring: 'ring-amber-500', hex: '#fde047' },
  { id: 'purple', label: 'Violeta', bg: 'bg-purple-300', text: 'text-purple-950', ring: 'ring-purple-500', hex: '#d8b4fe' },
  { id: 'sky', label: 'Celeste', bg: 'bg-sky-300', text: 'text-sky-950', ring: 'ring-sky-500', hex: '#7dd3fc' },
  { id: 'emerald', label: 'Verde', bg: 'bg-emerald-300', text: 'text-emerald-950', ring: 'ring-emerald-500', hex: '#86efac' },
  { id: 'pink', label: 'Rosa', bg: 'bg-pink-300', text: 'text-pink-950', ring: 'ring-pink-500', hex: '#f9a8d4' },
  { id: 'orange', label: 'Naranja', bg: 'bg-orange-300', text: 'text-orange-950', ring: 'ring-orange-500', hex: '#fdba74' }
];

export const ARTIFACT_BUTTONS: {
  id: ArtifactType;
  label: string;
  shortLabel: string;
  icon: any;
  colorClass: string;
  activeColorClass: string;
  bgHex: string;
  desc: string;
}[] = [
  {
    id: 'resumen',
    label: 'Resumen de Texto',
    shortLabel: 'Resumen',
    icon: FileText,
    colorClass: 'bg-amber-400 text-amber-950 border-amber-300 hover:bg-amber-300 hover:shadow-md',
    activeColorClass: 'bg-amber-400 text-amber-950 border-white ring-4 ring-amber-300 shadow-xl scale-110 -translate-y-1',
    bgHex: '#f59e0b',
    desc: 'Estructura analítica condensada'
  },
  {
    id: 'cuestionario',
    label: 'Cuestionario Activo',
    shortLabel: 'Quiz',
    icon: HelpCircle,
    colorClass: 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-400 hover:shadow-md',
    activeColorClass: 'bg-emerald-500 text-white border-white ring-4 ring-emerald-300 shadow-xl scale-110 -translate-y-1',
    bgHex: '#10b981',
    desc: 'Evaluación múltiple con soluciones'
  },
  {
    id: 'flashcards',
    label: 'Flashcards de Repaso',
    shortLabel: 'Cards',
    icon: Layers,
    colorClass: 'bg-sky-400 text-slate-950 border-sky-300 hover:bg-sky-300 hover:shadow-md',
    activeColorClass: 'bg-sky-400 text-slate-950 border-white ring-4 ring-sky-200 shadow-xl scale-110 -translate-y-1',
    bgHex: '#38bdf8',
    desc: 'Tarjetas de memoria y preguntas'
  },
  {
    id: 'guia',
    label: 'Guía de Estudio',
    shortLabel: 'Guía',
    icon: BookOpen,
    colorClass: 'bg-orange-500 text-white border-orange-400 hover:bg-orange-400 hover:shadow-md',
    activeColorClass: 'bg-orange-500 text-white border-white ring-4 ring-orange-300 shadow-xl scale-110 -translate-y-1',
    bgHex: '#f97316',
    desc: 'Hoja de ruta paso a paso'
  },
  {
    id: 'modelo_examen',
    label: 'Modelo de Examen',
    shortLabel: 'Examen',
    icon: Award,
    colorClass: 'bg-rose-500 text-white border-rose-400 hover:bg-rose-400 hover:shadow-md',
    activeColorClass: 'bg-rose-500 text-white border-white ring-4 ring-rose-300 shadow-xl scale-110 -translate-y-1',
    bgHex: '#f43f5e',
    desc: 'Simulacro de prueba'
  },
  {
    id: 'audio_podcast',
    label: 'Resumen de Audio',
    shortLabel: 'Audio',
    icon: Headphones,
    colorClass: 'bg-fuchsia-500 text-white border-fuchsia-400 hover:bg-fuchsia-400 hover:shadow-md',
    activeColorClass: 'bg-fuchsia-500 text-white border-white ring-4 ring-fuchsia-300 shadow-xl scale-110 -translate-y-1',
    bgHex: '#d946ef',
    desc: 'Podcast de audio sintetizado'
  },
  {
    id: 'infografia',
    label: 'Infografía Visual',
    shortLabel: 'Infografía',
    icon: Sparkles,
    colorClass: 'bg-lime-400 text-slate-950 border-lime-300 hover:bg-lime-300 hover:shadow-md',
    activeColorClass: 'bg-lime-400 text-slate-950 border-white ring-4 ring-lime-200 shadow-xl scale-110 -translate-y-1',
    bgHex: '#a3e635',
    desc: 'Esquema visual y pilares'
  },
  {
    id: 'presentacion',
    label: 'Presentación',
    shortLabel: 'Slides',
    icon: SlidersHorizontal,
    colorClass: 'bg-blue-500 text-white border-blue-400 hover:bg-blue-400 hover:shadow-md',
    activeColorClass: 'bg-blue-500 text-white border-white ring-4 ring-blue-300 shadow-xl scale-110 -translate-y-1',
    bgHex: '#3b82f6',
    desc: 'Diapositivas y conceptos'
  }
];

function renderMarkdownWithAuthorHighlight(text: string, colorId?: string) {
  if (!text) return '';
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded shadow-xs',
    purple: 'bg-purple-200 text-purple-950 font-bold px-1.5 py-0.5 rounded shadow-xs',
    sky: 'bg-sky-200 text-sky-950 font-bold px-1.5 py-0.5 rounded shadow-xs',
    emerald: 'bg-emerald-200 text-emerald-950 font-bold px-1.5 py-0.5 rounded shadow-xs',
    pink: 'bg-pink-200 text-pink-950 font-bold px-1.5 py-0.5 rounded shadow-xs',
    orange: 'bg-orange-200 text-orange-950 font-bold px-1.5 py-0.5 rounded shadow-xs'
  };
  const activeClass = colorMap[colorId || 'amber'] || colorMap.amber;

  return text
    .replace(/<mark[^>]*>(.*?)<\/mark>/gi, `<mark class="${activeClass}">$1</mark>`)
    .replace(/^## (.*$)/gim, '<h2 class="text-base font-black text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-extrabold text-indigo-900 mt-3 mb-1.5">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-slate-900">$1</strong>')
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-indigo-500 pl-3 py-1 my-2 text-slate-700 bg-indigo-50/60 rounded-r-xl italic">$1</blockquote>')
    .replace(/\[(.*?)\]\(#(.*?)\)/gim, '<a href="#$2" class="text-indigo-600 font-bold underline hover:text-indigo-800">$1</a>');
}

interface NotebookArtifactsProps {
  notebook: Notebook;
  onAddArtifact: (artifact: StudyArtifact) => void;
  onUpdateArtifact: (artifact: StudyArtifact) => void;
  onDeleteArtifact?: (artifactId: string) => void;
  initialArtifactType?: ArtifactType | null;
  onClearInitialType?: () => void;
}

export const NotebookArtifacts: React.FC<NotebookArtifactsProps> = ({
  notebook,
  onAddArtifact,
  onUpdateArtifact,
  onDeleteArtifact,
  initialArtifactType = null,
  onClearInitialType
}) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    notebook.artifacts[0]?.id || null
  );

  // Pop-up modal state for PDF Document Viewer
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [viewerMode, setViewerMode] = useState<'pdf' | 'interactive'>('pdf');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Pop-up modal state for parameter customization
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(Boolean(initialArtifactType));
  const [chosenType, setChosenType] = useState<ArtifactType>(initialArtifactType || 'resumen');
  const [isGenerating, setIsGenerating] = useState(false);

  // Sources to be used for generating this artifact
  const [selectedSourceIdsForArtifact, setSelectedSourceIdsForArtifact] = useState<string[]>(() => {
    const active = notebook.sources.filter(s => s.selectedForChat !== false).map(s => s.id);
    return active.length > 0 ? active : notebook.sources.map(s => s.id);
  });

  // Secondary pop-up modal for selecting/deselecting sources
  const [isEditSourcesModalOpen, setIsEditSourcesModalOpen] = useState(false);
  const [tempSourceIds, setTempSourceIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialArtifactType) {
      setChosenType(initialArtifactType);
      setIsConfigModalOpen(true);
      if (onClearInitialType) onClearInitialType();
    }
  }, [initialArtifactType, onClearInitialType]);

  useEffect(() => {
    if (selectedSourceIdsForArtifact.length === 0 && notebook.sources.length > 0) {
      const active = notebook.sources.filter(s => s.selectedForChat !== false).map(s => s.id);
      setSelectedSourceIdsForArtifact(active.length > 0 ? active : notebook.sources.map(s => s.id));
    }
  }, [notebook.sources]);

  // Personalization settings
  const [quality, setQuality] = useState<'bajo' | 'medio' | 'alto' | 'detallista'>('alto');
  const [format, setFormat] = useState<'texto' | 'punteo' | 'brainstorming' | 'jerarquico'>('jerarquico');
  const [length, setLength] = useState<'conciso' | 'intermedio' | 'detallado'>('intermedio');
  const [citeSources, setCiteSources] = useState(true);
  const [keepTitles, setKeepTitles] = useState(true);
  const [highlightAuthors, setHighlightAuthors] = useState(true);
  const [authorHighlightColor, setAuthorHighlightColor] = useState<string>('amber');
  const [addExamples, setAddExamples] = useState(true);
  const [generateGraphics, setGenerateGraphics] = useState(true);
  const [generateIndex, setGenerateIndex] = useState(true);

  // Feedback state
  const [feedbackPromptOpen, setFeedbackPromptOpen] = useState(false);
  const [customComment, setCustomComment] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Interactive Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Interactive Flashcards state
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Podcast player state
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [podcastIndex, setPodcastIndex] = useState(0);

  const activeArtifact = notebook.artifacts.find((a) => a.id === selectedArtifactId) || notebook.artifacts[0];

  const handleOpenArtifactPdf = (artId: string) => {
    setSelectedArtifactId(artId);
    setViewerMode('pdf');
    setIsViewerModalOpen(true);
    setShowQuizResults(false);
    setSelectedAnswers({});
    setIsFlipped(false);
    PodcastSpeaker.stop();
    setIsPlayingPodcast(false);
  };

  const handleOpenConfigModal = (type: ArtifactType) => {
    setChosenType(type);
    if (selectedSourceIdsForArtifact.length === 0 && notebook.sources.length > 0) {
      const active = notebook.sources.filter(s => s.selectedForChat !== false).map(s => s.id);
      setSelectedSourceIdsForArtifact(active.length > 0 ? active : notebook.sources.map(s => s.id));
    }
    setIsConfigModalOpen(true);
    if (onClearInitialType) onClearInitialType();
  };

  const handleOpenEditSourcesModal = () => {
    setTempSourceIds([...selectedSourceIdsForArtifact]);
    setIsEditSourcesModalOpen(true);
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notebook.sources.length === 0) {
      alert('Antes de generar un artefacto necesitas cargar al menos una fuente en este cuaderno.');
      return;
    }

    const sourcesToUse = notebook.sources.filter(s =>
      selectedSourceIdsForArtifact.includes(s.id)
    );

    if (sourcesToUse.length === 0) {
      alert('Por favor selecciona al menos una fuente para elaborar este artefacto.');
      return;
    }

    setIsGenerating(true);

    const personalization: ArtifactPersonalization = {
      quality,
      format,
      length,
      citeSources,
      keepTitles,
      highlightAuthors,
      authorHighlightColor,
      addExamples,
      generateGraphics,
      generateIndex
    };

    try {
      const res = await fetch('/api/generate-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType: chosenType,
          personalization,
          sources: sourcesToUse,
          notebookTitle: notebook.title
        })
      });

      if (!res.ok) throw new Error('Error del servidor');
      const data = await res.json();
      const generated = data.artifact;

      const newArtifact: StudyArtifact = {
        id: `art-${Date.now()}`,
        type: chosenType,
        title: generated.title || `Artefacto: ${chosenType}`,
        createdAt: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        personalization,
        summaryText: generated.summaryText || '',
        citations: generated.citations || sourcesToUse.map(s => `Fuente: ${s.title}`),
        structuredData: generated.structuredData
      };

      onAddArtifact(newArtifact);
      setSelectedArtifactId(newArtifact.id);
      setIsConfigModalOpen(false);
      setViewerMode('pdf');
      setIsViewerModalOpen(true);
    } catch (err) {
      console.warn('Fallback generation trigger', err);
      // Resilient fallback
      const s0 = sourcesToUse[0] || notebook.sources[0];
      const title = s0?.title || notebook.title;
      const sentences = (s0?.content || '').split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);

      const fallbackArtifact: StudyArtifact = {
        id: `art-${Date.now()}`,
        type: chosenType,
        title: `${chosenType === 'resumen' ? 'Resumen' : chosenType === 'cuestionario' ? 'Cuestionario' : chosenType.toUpperCase()}: ${title}`,
        createdAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        personalization,
        summaryText: `## ${title}\n\n### Síntesis Fundamentada\n${sentences[0] || 'Concepto central derivado de las fuentes.'}\n\n### Dinámica Operativa\n${sentences[1] || 'Desarrollo conceptual.'}\n\n> *Cita de fuente: [${title}]*`,
        citations: sourcesToUse.map(s => `Fuente: ${s.title}`)
      };

      onAddArtifact(fallbackArtifact);
      setSelectedArtifactId(fallbackArtifact.id);
      setIsConfigModalOpen(false);
      setViewerMode('pdf');
      setIsViewerModalOpen(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFeedback = (type: 'positive' | 'negative' | 'improvement') => {
    if (!activeArtifact) return;

    const updated = {
      ...activeArtifact,
      feedback: {
        ...activeArtifact.feedback,
        rating: type === 'positive' ? ('positive' as const) : ('negative' as const),
        improvementRequested: type === 'improvement'
      }
    };
    onUpdateArtifact(updated);

    if (type === 'improvement') {
      setFeedbackPromptOpen(true);
    }
  };

  const handleRefineArtifact = async () => {
    if (!customComment.trim() || !activeArtifact) return;
    setIsRefining(true);

    try {
      const res = await fetch('/api/refine-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentContent: activeArtifact.summaryText,
          feedbackType: 'custom_comment',
          comment: customComment,
          sources: notebook.sources
        })
      });

      if (!res.ok) throw new Error('Error al refinar');
      const data = await res.json();

      const updated: StudyArtifact = {
        ...activeArtifact,
        summaryText: data.updatedContent,
        feedback: {
          ...activeArtifact.feedback,
          comments: [...(activeArtifact.feedback?.comments || []), customComment]
        }
      };

      onUpdateArtifact(updated);
      setCustomComment('');
      setFeedbackPromptOpen(false);
    } catch (e) {
      console.warn('Refinement error', e);
    } finally {
      setIsRefining(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const playPodcastLine = (idx: number) => {
    if (!activeArtifact?.structuredData || !Array.isArray(activeArtifact.structuredData)) return;
    const line = activeArtifact.structuredData[idx];
    if (!line) {
      setIsPlayingPodcast(false);
      return;
    }

    setPodcastIndex(idx);
    setIsPlayingPodcast(true);

    PodcastSpeaker.speakLine(line.text, line.speaker, 1.0, () => {
      if (idx + 1 < activeArtifact.structuredData.length) {
        playPodcastLine(idx + 1);
      } else {
        setIsPlayingPodcast(false);
      }
    });
  };

  const currentButtonConfig = ARTIFACT_BUTTONS.find((b) => b.id === chosenType) || ARTIFACT_BUTTONS[0];
  const CurrentIcon = currentButtonConfig.icon;
  const selectedSourcesForGeneration = notebook.sources.filter(s =>
    selectedSourceIdsForArtifact.includes(s.id)
  );

  const renderBigArtifactFormatLogo = (type: ArtifactType) => {
    switch (type) {
      case 'resumen':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-rose-50 to-red-100/90 border-2 border-rose-300 text-rose-600 flex flex-col items-center justify-center shadow-xs">
            <FileText className="w-10 h-10 sm:w-11 sm:h-11 text-rose-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-[9px] tracking-wider uppercase">
              PDF RESUMEN
            </span>
          </div>
        );
      case 'cuestionario':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-emerald-50 to-teal-100/90 border-2 border-emerald-300 text-emerald-600 flex flex-col items-center justify-center shadow-xs">
            <HelpCircle className="w-10 h-10 sm:w-11 sm:h-11 text-emerald-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[9px] tracking-wider uppercase">
              CUESTIONARIO
            </span>
          </div>
        );
      case 'flashcards':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-sky-50 to-blue-100/90 border-2 border-sky-300 text-sky-600 flex flex-col items-center justify-center shadow-xs">
            <Layers className="w-10 h-10 sm:w-11 sm:h-11 text-sky-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-sky-600 text-white font-black text-[9px] tracking-wider uppercase">
              FLASHCARDS
            </span>
          </div>
        );
      case 'guia':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-orange-50 to-amber-100/90 border-2 border-orange-300 text-orange-600 flex flex-col items-center justify-center shadow-xs">
            <BookOpen className="w-10 h-10 sm:w-11 sm:h-11 text-orange-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-orange-600 text-white font-black text-[9px] tracking-wider uppercase">
              GUÍA PDF
            </span>
          </div>
        );
      case 'modelo_examen':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-rose-50 to-pink-100/90 border-2 border-rose-300 text-rose-600 flex flex-col items-center justify-center shadow-xs">
            <Award className="w-10 h-10 sm:w-11 sm:h-11 text-rose-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-[9px] tracking-wider uppercase">
              EXAMEN PDF
            </span>
          </div>
        );
      case 'audio_podcast':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-fuchsia-50 to-purple-100/90 border-2 border-fuchsia-300 text-fuchsia-600 flex flex-col items-center justify-center shadow-xs">
            <Headphones className="w-10 h-10 sm:w-11 sm:h-11 text-fuchsia-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-fuchsia-600 text-white font-black text-[9px] tracking-wider uppercase">
              AUDIO RESUMEN
            </span>
          </div>
        );
      case 'infografia':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-lime-50 to-emerald-100/90 border-2 border-lime-300 text-lime-600 flex flex-col items-center justify-center shadow-xs">
            <Sparkles className="w-10 h-10 sm:w-11 sm:h-11 text-lime-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-lime-600 text-white font-black text-[9px] tracking-wider uppercase">
              INFOGRAFÍA
            </span>
          </div>
        );
      case 'presentacion':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-blue-50 to-indigo-100/90 border-2 border-blue-300 text-blue-600 flex flex-col items-center justify-center shadow-xs">
            <SlidersHorizontal className="w-10 h-10 sm:w-11 sm:h-11 text-blue-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-black text-[9px] tracking-wider uppercase">
              PRESENTACIÓN
            </span>
          </div>
        );
      default:
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-indigo-50 to-slate-100/90 border-2 border-indigo-300 text-indigo-600 flex flex-col items-center justify-center shadow-xs">
            <FileText className="w-10 h-10 sm:w-11 sm:h-11 text-indigo-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-black text-[9px] tracking-wider uppercase">
              DOCUMENTO
            </span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* SECCIÓN VIOLETA DE: "RECURSOS DE APRENDIZAJE" */}
      <div className="bg-gradient-to-br from-purple-950 via-violet-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-700/60">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
          {/* Columna Izquierda: Título "Recursos de Aprendizaje" MÁS GRANDE y explicación */}
          <div className="flex-1 space-y-3 w-full lg:w-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-800/80 border border-violet-400/30 text-violet-200 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
              <span>Recursos de Aprendizaje</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Recursos de Aprendizaje
            </h2>

            <p className="text-xs sm:text-sm text-purple-200/90 font-medium leading-relaxed max-w-xl">
              Haz clic en cualquiera de los botones cuadrados para desplegar sus parámetros configurables antes de elaborar el artefacto:
            </p>
          </div>

          {/* Línea vertical fina que divide el título y la explicación de los botones */}
          <div className="hidden lg:block w-px self-stretch bg-purple-400/30 my-1" />
          <div className="block lg:hidden w-full h-px bg-purple-400/30" />

          {/* Columna Derecha: Botones de generación de Artefacto ordenados en filas de a 4 items */}
          <div className="shrink-0 w-full lg:w-auto flex justify-center">
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full sm:w-auto">
              {ARTIFACT_BUTTONS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpenConfigModal(item.id)}
                    title={`Desplegar parámetros para ${item.label}`}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer border-2 shadow-md hover:scale-105 hover:shadow-lg active:scale-95 ${item.colorClass}`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-black leading-tight text-center truncate max-w-[62px]">
                      {item.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* LISTADO DE ARTEFACTOS CREADOS: ESTADO VACÍO CUANDO NO EXISTE NINGUNO */}
      {notebook.artifacts.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-xs space-y-4 my-2 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center mx-auto shadow-xs">
            <Layers className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              No se ha generado ningún artefacto aún
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Haz clic en cualquiera de los botones cuadrados de colores de arriba para configurar sus parámetros y elaborar tu primer artefacto con IA.
            </p>
          </div>
        </div>
      )}

      {/* LISTADO DE ARTEFACTOS CREADOS: DOCUMENTOS QUE SE VEN COMO FUENTES */}
      {notebook.artifacts.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Artefactos Creados ({notebook.artifacts.length})</span>
              </span>
              <span className="text-[11px] text-slate-500">
                • Cada artefacto se presenta como un documento fuente. Haz clic para abrir el PDF con el resumen.
              </span>
            </div>
          </div>

          {/* Grid de artefactos formateados como documentos / fuentes reales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notebook.artifacts.map((art) => {
              const isSelected = art.id === selectedArtifactId;
              return (
                <div
                  key={art.id}
                  onClick={() => handleOpenArtifactPdf(art.id)}
                  className={`relative bg-white dark:bg-slate-900 border-2 rounded-3xl p-5 shadow-xs transition-all duration-200 flex flex-col items-center justify-between text-center cursor-pointer hover:shadow-lg hover:border-purple-400 group ${
                    isSelected
                      ? 'border-purple-400 bg-gradient-to-b from-purple-50/30 dark:from-purple-950/30 via-white dark:via-slate-900 to-white dark:to-slate-900 ring-2 ring-purple-200 dark:ring-purple-900 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Top Action Bar: Badge del tipo y botones de acción rápida */}
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {art.type === 'resumen' ? 'PDF RESUMEN' : art.type.replace('_', ' ').toUpperCase()}
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenArtifactPdf(art.id)}
                        title="Abrir PDF con el resumen"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {onDeleteArtifact && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar el artefacto "${art.title}"?`)) {
                              onDeleteArtifact(art.id);
                            }
                          }}
                          title="Eliminar artefacto"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Logo en grande del formato según corresponda */}
                  <div className="my-3 transform group-hover:scale-105 transition-transform duration-200">
                    {renderBigArtifactFormatLogo(art.type)}
                  </div>

                  {/* Nombre del documento y metadatos */}
                  <div className="w-full mt-2 pt-3 border-t border-slate-100 flex flex-col items-center">
                    <h4
                      className="font-black text-xs sm:text-sm text-center leading-snug line-clamp-2 text-slate-900 group-hover:text-purple-900 transition"
                      title={art.title}
                    >
                      {art.title}
                    </h4>

                    <p className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-full">
                      📎 Documento generado • {art.createdAt}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <BookOpen className="w-3 h-3 text-purple-600" />
                      <span>{art.citations?.length || 1} fuentes consultadas</span>
                    </div>

                    {/* Botón para abrir el documento / PDF con el resumen */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenArtifactPdf(art.id);
                      }}
                      className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-black shadow-xs transition group-hover:shadow-md cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Abrir Documento / PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VENTANA MODAL VISOR DE DOCUMENTO / PDF DEL ARTEFACTO */}
      {isViewerModalOpen && activeArtifact && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          {/* Header del Visor PDF (Toolbar superior de navegación y herramientas) */}
          <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
            {/* Título e identificación del documento */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                PDF
              </div>
              <div className="truncate max-w-xs sm:max-w-md">
                <h3 className="text-white text-xs sm:text-sm font-black truncate leading-tight">
                  {activeArtifact.title}
                </h3>
                <p className="text-[10px] text-slate-400 truncate">
                  Generado el {activeArtifact.createdAt} • Cuaderno: {notebook.title}
                </p>
              </div>
            </div>

            {/* Controles centrales: Switcher de modo + Zoom */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Selector de modo si el artefacto tiene datos estructurados interactivos */}
              {activeArtifact.structuredData && (
                <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewerMode('pdf')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      viewerMode === 'pdf'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Vista Hoja PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewerMode('interactive')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      viewerMode === 'interactive'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Modo Interactivo</span>
                  </button>
                </div>
              )}

              {/* Controles de Zoom */}
              {viewerMode === 'pdf' && (
                <div className="hidden sm:flex items-center bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(70, prev - 10))}
                    className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Reducir zoom"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-mono font-bold text-[11px] text-slate-300">{zoomLevel}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(140, prev + 10))}
                    className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Aumentar zoom"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Acciones del Visor: Copiar, Imprimir, Feedback y Cerrar */}
            <div className="flex items-center gap-1.5 sm:gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
                title="Imprimir o guardar como PDF nativo"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir / PDF</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(activeArtifact.summaryText)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer"
                title="Copiar texto del resumen"
              >
                {copiedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => handleFeedback('improvement')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer"
                title="Solicitar mejora al artefacto"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Mejorar</span>
              </button>

              <div className="h-6 w-px bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={() => {
                  setIsViewerModalOpen(false);
                  PodcastSpeaker.stop();
                  setIsPlayingPodcast(false);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition border border-slate-700 cursor-pointer"
                title="Cerrar visor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer de mejora dirigida si el usuario solicita refinamiento */}
          {feedbackPromptOpen && (
            <div className="p-4 bg-amber-50 border-b border-amber-200 animate-in fade-in shrink-0">
              <div className="max-w-3xl mx-auto">
                <h4 className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  Comentario de Mejora Dirigida
                </h4>
                <p className="text-[11px] text-amber-800 mb-2">
                  "Modifica únicamente aquello que sea necesario y conserva el resto del contexto."
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ej. Haz la sección 2 más concisa, o agrega un ejemplo del bucle Construir-Medir..."
                    value={customComment}
                    onChange={(e) => setCustomComment(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-amber-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                  <button
                    onClick={handleRefineArtifact}
                    disabled={isRefining}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {isRefining ? 'Refinando...' : 'Aplicar Mejora'}
                  </button>
                  <button
                    onClick={() => setFeedbackPromptOpen(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-amber-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Canvas Principal del Visor */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/90 flex justify-center print:p-0 print:bg-white">
            {viewerMode === 'pdf' ? (
              /* HOJA REALISTA DE DOCUMENTO PDF EN FORMATO A4 */
              <div
                className="bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 max-w-3xl w-full p-8 sm:p-14 min-h-[850px] relative my-4 print:shadow-none print:border-none print:m-0 print:p-6 transition-transform duration-150"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              >
                {/* Membrete formal de documento */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-600"></span>
                    <span>CUADERNO: {notebook.title.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-indigo-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>VERIFICADO CON FUENTES • {activeArtifact.createdAt}</span>
                  </div>
                </div>

                {/* Título Principal del Documento */}
                <div className="mt-6 mb-4">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {activeArtifact.type.toUpperCase()}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2 leading-tight">
                    {activeArtifact.title}
                  </h1>

                  {/* Parámetros de personalización y autor */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>
                      <strong>Calidad:</strong> {activeArtifact.personalization?.quality || 'Alto'}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Extensión:</strong> {activeArtifact.personalization?.length || 'Intermedio'}
                    </span>
                    {activeArtifact.personalization?.highlightAuthors && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-700 font-semibold">
                          <span>Autores resaltados:</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                              AUTHOR_COLORS.find(c => c.id === activeArtifact.personalization?.authorHighlightColor)?.bg || 'bg-amber-300'
                            } ${
                              AUTHOR_COLORS.find(c => c.id === activeArtifact.personalization?.authorHighlightColor)?.text || 'text-amber-950'
                            }`}
                          >
                            Referentes teóricos
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Contenido Completo del Resumen con Markdown Formateado */}
                <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed my-6 font-serif">
                  <div
                    className="whitespace-pre-wrap font-sans text-slate-800"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdownWithAuthorHighlight(
                        activeArtifact.summaryText,
                        activeArtifact.personalization?.authorHighlightColor
                      )
                    }}
                  />
                </div>

                {/* Si es Cuestionario, añadir anexo de preguntas impresas en el PDF */}
                {activeArtifact.type === 'cuestionario' && activeArtifact.structuredData && Array.isArray(activeArtifact.structuredData) && (
                  <div className="mt-8 pt-6 border-t-2 border-slate-200 space-y-4">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                      Anexo: Preguntas y Soluciones Verificadas
                    </h3>
                    <div className="space-y-4">
                      {activeArtifact.structuredData.map((q: any, i: number) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                          <p className="font-bold text-slate-900 mb-2">
                            {i + 1}. {q.question}
                          </p>
                          <ul className="space-y-1 pl-4 mb-2">
                            {q.options?.map((opt: string, optIdx: number) => (
                              <li
                                key={optIdx}
                                className={opt === q.correctAnswer ? 'font-bold text-emerald-800' : 'text-slate-600'}
                              >
                                • {opt} {opt === q.correctAnswer && '(✓ Respuesta Correcta)'}
                              </li>
                            ))}
                          </ul>
                          <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                            <strong>Explicación:</strong> {q.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Si son Flashcards, añadir anexo de tarjetas impresas en el PDF */}
                {activeArtifact.type === 'flashcards' && activeArtifact.structuredData && Array.isArray(activeArtifact.structuredData) && (
                  <div className="mt-8 pt-6 border-t-2 border-slate-200 space-y-4">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                      Anexo: Fichas de Repaso Mnemotécnico
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeArtifact.structuredData.map((card: any, i: number) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {card.category || `Ficha ${i + 1}`}
                          </span>
                          <h5 className="font-bold text-slate-900">{card.question}</h5>
                          <p className="text-slate-700 bg-white p-2 rounded border border-slate-100 font-medium">
                            {card.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sección de Citas y Anclaje a Datos en el documento PDF */}
                {activeArtifact.citations && activeArtifact.citations.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-slate-200 bg-slate-50/80 p-5 rounded-xl border">
                    <div className="flex items-center gap-2 mb-2 text-indigo-900 font-black text-xs uppercase tracking-wide">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Fuentes Consultadas y Anclaje Estricto a Datos</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                      Este documento ha sido generado exclusivamente a partir de la información explícita provista en las fuentes cargadas.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeArtifact.citations.map((cite, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs"
                        >
                          📎 {cite}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pie de página del documento PDF */}
                <div className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Página 1 de 1 • Resumen de Aprendizaje</span>
                  <span>Sistema de Estudio Inteligente</span>
                </div>
              </div>
            ) : (
              /* MODO INTERACTIVO (Práctica activa según el formato del artefacto) */
              <div className="max-w-2xl w-full mx-auto my-4 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
                {/* Header del Modo Interactivo */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      Modo Interactivo
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {activeArtifact.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewerMode('pdf')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Hoja PDF</span>
                  </button>
                </div>

                {/* TYPE: Cuestionario Interactivo */}
                {activeArtifact.type === 'cuestionario' && activeArtifact.structuredData && Array.isArray(activeArtifact.structuredData) && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Cuestionario con Autoevaluación</h4>
                        <p className="text-xs text-slate-500">Selecciona tu respuesta en cada pregunta para comprobar tu dominio.</p>
                      </div>
                      <button
                        onClick={() => setShowQuizResults(!showQuizResults)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition cursor-pointer"
                      >
                        {showQuizResults ? 'Ocultar Corrección' : 'Verificar Respuestas'}
                      </button>
                    </div>

                    <div className="space-y-5">
                      {activeArtifact.structuredData.map((q: any, qIdx: number) => {
                        const selected = selectedAnswers[qIdx];
                        const isCorrect = selected === q.correctAnswer;
                        return (
                          <div key={qIdx} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                            <div className="flex items-start gap-2 mb-3">
                              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {qIdx + 1}
                              </span>
                              <h5 className="font-bold text-slate-900 text-sm leading-snug">{q.question}</h5>
                            </div>

                            <div className="space-y-2 pl-7">
                              {q.options?.map((opt: string, optIdx: number) => {
                                const isOptSelected = selected === opt;
                                const isOptCorrect = opt === q.correctAnswer;
                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    onClick={() => setSelectedAnswers(prev => ({ ...prev, [qIdx]: opt }))}
                                    className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition flex items-center justify-between cursor-pointer ${
                                      showQuizResults
                                        ? isOptCorrect
                                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                          : isOptSelected
                                          ? 'bg-rose-50 border-rose-400 text-rose-900'
                                          : 'bg-white border-slate-200 text-slate-600'
                                        : isOptSelected
                                        ? 'bg-purple-50 border-purple-400 text-purple-900 font-semibold shadow-xs'
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {showQuizResults && isOptCorrect && (
                                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {showQuizResults && (
                              <div className="mt-3 pl-7 pt-3 border-t border-slate-200/60 text-xs">
                                <p className="text-slate-700 font-semibold mb-1">
                                  {isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto.'}
                                </p>
                                <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                                {q.sourceCitation && (
                                  <p className="text-[11px] text-purple-600 italic mt-1">{q.sourceCitation}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TYPE: Flashcards Interactivas */}
                {activeArtifact.type === 'flashcards' && activeArtifact.structuredData && Array.isArray(activeArtifact.structuredData) && (
                  <div className="space-y-4">
                    {(() => {
                      const cards = activeArtifact.structuredData;
                      const card = cards[activeCardIndex] || cards[0];
                      if (!card) return null;

                      return (
                        <div>
                          {/* Card Flip Container */}
                          <div
                            onClick={() => setIsFlipped(!isFlipped)}
                            className={`min-h-[220px] p-8 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                              isFlipped
                                ? 'bg-gradient-to-br from-purple-700 to-indigo-800 text-white shadow-xl'
                                : 'bg-white border-slate-200 shadow-md hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={`font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                                  isFlipped ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-700'
                                }`}
                              >
                                {card.category || 'Concepto'}
                              </span>
                              <span className={isFlipped ? 'text-purple-200' : 'text-slate-400'}>
                                {activeCardIndex + 1} de {cards.length}
                              </span>
                            </div>

                            <div className="my-6 text-center">
                              <h4 className={`text-base sm:text-lg font-bold leading-relaxed ${isFlipped ? 'text-white' : 'text-slate-900'}`}>
                                {isFlipped ? card.answer : card.question}
                              </h4>
                              {!isFlipped && showHint && card.hint && (
                                <p className="text-xs text-amber-600 mt-3 font-semibold bg-amber-50 p-2 rounded-xl border border-amber-200">
                                  💡 Pista: {card.hint}
                                </p>
                              )}
                            </div>

                            <div className="text-center text-[11px] opacity-70">
                              {isFlipped ? 'Click para voltear a la pregunta' : 'Click para ver la respuesta'}
                            </div>
                          </div>

                          {/* Navigation buttons */}
                          <div className="flex items-center justify-between pt-4">
                            <button
                              onClick={() => {
                                setIsFlipped(false);
                                setShowHint(false);
                                setActiveCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Anterior</span>
                            </button>

                            {card.hint && (
                              <button
                                onClick={() => setShowHint(!showHint)}
                                className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                              >
                                {showHint ? 'Ocultar Pista' : 'Ver Pista'}
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setIsFlipped(false);
                                setShowHint(false);
                                setActiveCardIndex((prev) => (prev + 1) % cards.length);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 cursor-pointer"
                            >
                              <span>Siguiente</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* TYPE: Resumen de Audio (Podcast) */}
                {activeArtifact.type === 'audio_podcast' && activeArtifact.structuredData && Array.isArray(activeArtifact.structuredData) && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-5 rounded-2xl flex items-center justify-between shadow-md">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (isPlayingPodcast) {
                              PodcastSpeaker.pause();
                              setIsPlayingPodcast(false);
                            } else {
                              playPodcastLine(podcastIndex);
                            }
                          }}
                          className="w-12 h-12 rounded-full bg-white text-purple-700 flex items-center justify-center font-bold shadow-md hover:scale-105 transition cursor-pointer"
                        >
                          {isPlayingPodcast ? <Pause className="w-5 h-5 fill-purple-700" /> : <Play className="w-5 h-5 fill-purple-700 ml-0.5" />}
                        </button>
                        <div>
                          <h4 className="font-bold text-sm leading-tight">Reproducción de Audio-Resumen</h4>
                          <p className="text-xs text-purple-100">
                            {isPlayingPodcast ? 'Reproduciendo con síntesis de voz en español' : 'Pausado'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          PodcastSpeaker.stop();
                          setIsPlayingPodcast(false);
                          setPodcastIndex(0);
                        }}
                        className="p-2 rounded-lg hover:bg-white/20 text-white/90 cursor-pointer"
                        title="Reiniciar audio"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeArtifact.structuredData.map((line: any, idx: number) => {
                        const isHost = line.speaker?.includes('Sofía');
                        const isCurrent = isPlayingPodcast && podcastIndex === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => playPodcastLine(idx)}
                            className={`p-4 rounded-xl border transition cursor-pointer ${
                              isCurrent
                                ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300'
                                : isHost
                                ? 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-200'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={`font-bold ${isHost ? 'text-indigo-700' : 'text-slate-700'}`}>
                                {line.speaker}
                              </span>
                              <span className="text-[10px] text-slate-400">{line.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed">{line.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TYPE: Infografía Visual */}
                {activeArtifact.type === 'infografia' && activeArtifact.structuredData && (
                  <div className="space-y-6">
                    {activeArtifact.structuredData.highlightStat && (
                      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-6 rounded-2xl text-center shadow-sm">
                        <span className="text-4xl font-black block tracking-tight">
                          {activeArtifact.structuredData.highlightStat.number}
                        </span>
                        <span className="text-xs text-purple-100 font-semibold max-w-sm mx-auto block mt-1">
                          {activeArtifact.structuredData.highlightStat.label}
                        </span>
                      </div>
                    )}

                    {activeArtifact.structuredData.pillars && Array.isArray(activeArtifact.structuredData.pillars) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {activeArtifact.structuredData.pillars.map((pillar: any, i: number) => (
                          <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${pillar.color || 'from-purple-600 to-indigo-700'} text-white flex items-center justify-center font-bold text-xs mb-3 shadow-xs`}>
                              {i + 1}
                            </div>
                            <h5 className="font-bold text-slate-900 text-sm mb-1">{pillar.title}</h5>
                            <p className="text-xs text-slate-600 leading-relaxed">{pillar.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. VENTANA POP-UP PARA CUSTOMIZAR LOS PARÁMETROS ANTES DE ELABORAR EL ARTEFACTO */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 my-auto max-h-[92vh] overflow-y-auto space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Pop-up */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${currentButtonConfig.colorClass}`}>
                  <CurrentIcon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase text-purple-700 dark:text-purple-400 tracking-wider block">
                    Parámetros Configurables
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Elaborar {currentButtonConfig.label}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-6">
              <div className="space-y-5">
                {/* 1. Calidad del procesamiento: (Bajo / medio / alto /detallista) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      • Calidad del procesamiento:
                    </label>
                    <span className="text-[11px] font-extrabold text-purple-700 capitalize px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200">
                      {quality}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['bajo', 'medio', 'alto', 'detallista'] as const).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuality(q)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition border text-center cursor-pointer ${
                          quality === q
                            ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Formato de resumen: (Texto, punteo, Brainstorming…) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      • Formato de resumen:
                    </label>
                    <span className="text-[11px] font-extrabold text-purple-700 capitalize px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200">
                      {format}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'texto', label: 'Texto' },
                      { id: 'punteo', label: 'Punteo' },
                      { id: 'brainstorming', label: 'Brainstorming' },
                      { id: 'jerarquico', label: 'Jerárquico' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFormat(f.id as any)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                          format === f.id
                            ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Extensión del resumen: (Conciso, intermedio, detallado) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      • Extensión del resumen:
                    </label>
                    <span className="text-[11px] font-extrabold text-purple-700 capitalize px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200">
                      {length}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['conciso', 'intermedio', 'detallado'] as const).map((len) => (
                      <button
                        key={len}
                        type="button"
                        onClick={() => setLength(len)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition border text-center cursor-pointer ${
                          length === len
                            ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CASILLAS PARA TILDAR () */}
                <div className="space-y-3 pt-2">
                  <span className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Casillas para tildar ():
                  </span>

                  {/* 4. Citar fuentes de donde se tomó la información dentro del texto. */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50 hover:bg-purple-50/50 rounded-2xl border border-slate-200 hover:border-purple-300 cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={citeSources}
                      onChange={(e) => setCiteSources(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded-md border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="text-xs text-slate-800 font-bold leading-snug">
                      <span className="text-slate-900">• Citar fuentes de donde se tomó la información dentro del texto.</span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Inserta referencias explícitas a cada fuente o documento analizado.
                      </p>
                    </div>
                  </label>

                  {/* 5. Tener en cuenta Títulos y Subtítulos de la fuente, si la misma es de texto */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50 hover:bg-purple-50/50 rounded-2xl border border-slate-200 hover:border-purple-300 cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={keepTitles}
                      onChange={(e) => setKeepTitles(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded-md border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="text-xs text-slate-800 font-bold leading-snug">
                      <span className="text-slate-900">•  Tener en cuenta Títulos y Subtítulos de la fuente, si la misma es de texto</span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Conserva la jerarquía de secciones y ordenación original de los autores.
                      </p>
                    </div>
                  </label>

                  {/* 6. Destacar autores que se mencionen con un color distinto (y elección de color si se tilda) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <label className="flex items-start gap-3.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={highlightAuthors}
                        onChange={(e) => setHighlightAuthors(e.target.checked)}
                        className="mt-0.5 w-5 h-5 rounded-md border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <div className="text-xs text-slate-800 font-bold leading-snug">
                        <span className="text-slate-900">•  Destacar autores que se mencionen con un color distinto (y elección de color si se tilda)</span>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Resalta a los referentes teóricos (ej. Eric Ries, Osterwalder) con el color que elijas.
                        </p>
                      </div>
                    </label>

                    {/* Selector de color desplegado si se tilda */}
                    {highlightAuthors && (
                      <div className="pl-8 pt-2 border-t border-slate-200 animate-in fade-in space-y-2.5">
                        <span className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
                          Elección de color para destacar autores:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {AUTHOR_COLORS.map((c) => {
                            const isColorSelected = authorHighlightColor === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setAuthorHighlightColor(c.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                  isColorSelected
                                    ? `${c.bg} ${c.text} border-slate-400 ring-2 ${c.ring} shadow-xs scale-105`
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/20"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span>{c.label}</span>
                                {isColorSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Muestra en vivo */}
                        <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-2">
                          <span>Vista previa del color elegido:</span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                              AUTHOR_COLORS.find(c => c.id === authorHighlightColor)?.bg || 'bg-amber-300'
                            } ${
                              AUTHOR_COLORS.find(c => c.id === authorHighlightColor)?.text || 'text-amber-950'
                            }`}
                          >
                            Eric Ries (Autor)
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                              AUTHOR_COLORS.find(c => c.id === authorHighlightColor)?.bg || 'bg-amber-300'
                            } ${
                              AUTHOR_COLORS.find(c => c.id === authorHighlightColor)?.text || 'text-amber-950'
                            }`}
                          >
                            Alexander Osterwalder
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 7. Añadir ejemplos periódicamente para ayudar a la explicación (si no se elige esto, el resumen se reduce a definición cruda de conceptos) */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50 hover:bg-purple-50/50 rounded-2xl border border-slate-200 hover:border-purple-300 cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={addExamples}
                      onChange={(e) => setAddExamples(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded-md border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="text-xs text-slate-800 font-bold leading-snug">
                      <span className="text-slate-900">•  Añadir ejemplos periódicamente para ayudar a la explicación</span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5 italic">
                        (si no se elige esto, el resumen se reduce a definición cruda de conceptos)
                      </p>
                    </div>
                  </label>

                  {/* 8. Generar Imágenes y gráficos en conjunto con el texto. */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50 hover:bg-purple-50/50 rounded-2xl border border-slate-200 hover:border-purple-300 cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={generateGraphics}
                      onChange={(e) => setGenerateGraphics(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded-md border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="text-xs text-slate-800 font-bold leading-snug">
                      <span className="text-slate-900">•  Generar Imágenes y gráficos en conjunto con el texto.</span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Produce diagramas visuales estructurados y mapas conceptuales de apoyo.
                      </p>
                    </div>
                  </label>

                  {/* 9. Generar índice con hipervínculos a los títulos y subtítulos generados, si es que existen. */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50 hover:bg-purple-50/50 rounded-2xl border border-slate-200 hover:border-purple-300 cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={generateIndex}
                      onChange={(e) => setGenerateIndex(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded-md border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="text-xs text-slate-800 font-bold leading-snug">
                      <span className="text-slate-900">•  Generar índice con hipervínculos a los títulos y subtítulos generados, si es que existen.</span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Agrega un índice clicable para navegar con fluidez entre títulos y subtítulos.
                      </p>
                    </div>
                  </label>
                </div>

                {/* FUENTES QUE SERÁN UTILIZADAS PARA GENERAR EL ARTEFACTO + BOTÓN PARA EDITAR ANTES DE CONTINUAR */}
                <div className="bg-purple-50/80 rounded-2xl border-2 border-purple-200 p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-[11px] font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-purple-700" />
                        <span>Fuentes que serán utilizadas para generar el artefacto:</span>
                      </span>
                      <p className="text-[11px] text-purple-800/80 mt-0.5">
                        {selectedSourcesForGeneration.length} de {notebook.sources.length} {notebook.sources.length === 1 ? 'fuente' : 'fuentes'} seleccionadas
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenEditSourcesModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-extrabold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Editar fuentes a utilizar</span>
                    </button>
                  </div>

                  {/* Listado visual de fuentes seleccionadas */}
                  {selectedSourcesForGeneration.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto">
                      {selectedSourcesForGeneration.map((src) => (
                        <div
                          key={src.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-purple-200 text-slate-800 text-xs font-bold shadow-2xs"
                        >
                          <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                            {src.type}
                          </span>
                          <span className="truncate max-w-[180px]">{src.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No hay fuentes seleccionadas. Haz clic en "Editar fuentes a utilizar" para seleccionar al menos una.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de elaboración del artefacto con los parámetros elegidos */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || selectedSourcesForGeneration.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-700 via-violet-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/25 transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Elaborando artefacto con IA...' : `Elaborar ${currentButtonConfig.label}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. SEGUNDA VENTANA POP-UP: SELECCIONAR / DESELECCIONAR FUENTES */}
      {isEditSourcesModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div
            className="bg-white text-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 my-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-purple-700 tracking-wider block">
                  Configuración de Fuentes
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Seleccionar fuentes para este artefacto
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Elige cuáles fuentes se usarán para elaborar {currentButtonConfig.label}:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditSourcesModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-600">
                {tempSourceIds.length} de {notebook.sources.length} seleccionadas
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTempSourceIds(notebook.sources.map(s => s.id))}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-extrabold transition cursor-pointer"
                >
                  Tildar todas
                </button>
                <button
                  type="button"
                  onClick={() => setTempSourceIds([])}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Destildar todas
                </button>
              </div>
            </div>

            {/* Lista con checkboxes */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {notebook.sources.map((src) => {
                const isChecked = tempSourceIds.includes(src.id);
                return (
                  <label
                    key={src.id}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition cursor-pointer select-none ${
                      isChecked
                        ? 'bg-purple-50/70 border-purple-400 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setTempSourceIds(prev =>
                          isChecked ? prev.filter(id => id !== src.id) : [...prev, src.id]
                        );
                      }}
                      className="w-5 h-5 rounded-md border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {src.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="uppercase font-extrabold text-[10px] text-purple-700">
                          {src.type}
                        </span>
                        <span>•</span>
                        <span>{src.wordCount} palabras</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Botones de acción del modal de fuentes */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditSourcesModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSourceIdsForArtifact([...tempSourceIds]);
                  setIsEditSourcesModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
              >
                Confirmar selección ({tempSourceIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
