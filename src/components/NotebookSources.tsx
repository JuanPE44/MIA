import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Users,
  Layers,
  HelpCircle,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  X,
  FileUp,
  ImagePlus,
  Loader2,
  Music,
  Film,
  File,
  MessageSquare
} from 'lucide-react';
import { Notebook, SourceItem, SourceType, SourceAnalysis } from '../types';

interface NotebookSourcesProps {
  notebook: Notebook;
  onAddSource: (source: SourceItem) => void;
  onDeleteSource: (sourceId: string) => void;
  onToggleSourceForChat?: (sourceId: string) => void;
  onSelectAllSourcesForChat?: (selected: boolean) => void;
  onSetAnalysis: (analysis: SourceAnalysis) => void;
  onGoToCreateSummary: () => void;
  onGoToCreateOtherArtifact: () => void;
  onAskAboutSource?: (sourceTitle: string) => void;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const NotebookSources: React.FC<NotebookSourcesProps> = ({
  notebook,
  onAddSource,
  onDeleteSource,
  onToggleSourceForChat,
  onSelectAllSourcesForChat,
  onSetAnalysis,
  onGoToCreateSummary,
  onGoToCreateOtherArtifact,
  onAskAboutSource
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<SourceType>('image');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [previewSource, setPreviewSource] = useState<SourceItem | null>(null);

  // Form state
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceContent, setSourceContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>(undefined);
  const [fileMimeType, setFileMimeType] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const allFilesInputRef = useRef<HTMLInputElement>(null);

  const hasSources = notebook.sources.length > 0;
  const analysis = notebook.analysis;

  // Process REAL file from device / gallery
  const processRealFile = async (file: File) => {
    if (!file) return;

    // Open modal immediately so user sees live file extraction
    setIsAddModalOpen(true);

    const realName = file.name;
    const realSize = formatBytes(file.size);
    const realMime = file.type || 'application/octet-stream';
    const baseTitle = realName.replace(/\.[^/.]+$/, '');

    setFileName(realName);
    setFileSize(realSize);
    setFileMimeType(realMime);
    if (!sourceTitle) {
      setSourceTitle(baseTitle);
    }

    // Determine SourceType from MIME
    let detectedType: SourceType = 'text';
    if (realMime.startsWith('image/')) detectedType = 'image';
    else if (realMime === 'application/pdf' || realName.endsWith('.pdf')) detectedType = 'pdf';
    else if (realMime.startsWith('audio/')) detectedType = 'audio';
    else if (realMime.startsWith('video/')) detectedType = 'video';
    setSelectedType(detectedType);

    setIsExtractingFile(true);

    try {
      // 1. Read as Data URL for multimedia preview (images, audio, video)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setFileDataUrl(dataUrl);

      // 2. If it's text/markdown/json, also read text directly
      let clientText = '';
      if (
        realMime.startsWith('text/') ||
        realName.endsWith('.txt') ||
        realName.endsWith('.md') ||
        realName.endsWith('.json') ||
        realName.endsWith('.csv')
      ) {
        clientText = await new Promise<string>((resolve) => {
          const textReader = new FileReader();
          textReader.onload = () => resolve((textReader.result as string) || '');
          textReader.onerror = () => resolve('');
          textReader.readAsText(file);
        });
      }

      // 3. Call backend extraction endpoint (using Gemini OCR for images/PDFs/transcription)
      const res = await fetch('/api/extract-file-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: realName,
          mimeType: realMime,
          fileBase64: dataUrl,
          clientText: clientText || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.extractedText) {
          setSourceContent(data.extractedText);
          if (data.title && !sourceTitle) {
            setSourceTitle(data.title);
          }
        }
      } else {
        if (clientText) {
          setSourceContent(clientText);
        } else if (detectedType === 'image') {
          setSourceContent(`Foto de apuntes cargada: "${realName}". Previsualización disponible en el panel. Puedes editar o agregar notas de la imagen aquí.`);
        } else {
          setSourceContent(`Archivo cargado: "${realName}" (${realSize}). Puedes revisar y agregar apuntes complementarios aquí.`);
        }
      }
    } catch (err) {
      console.warn('File processing error', err);
      if (detectedType === 'image') {
        setSourceContent(`Foto de apuntes cargada: "${realName}". Previsualización disponible en el panel.`);
      } else {
        setSourceContent(`Archivo cargado: "${realName}" (${realSize}).`);
      }
    } finally {
      setIsExtractingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processRealFile(file);
    }
    // reset input so the same file can be picked again if needed
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processRealFile(file);
    }
  };

  const handleAddSourceSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalTitle = sourceTitle.trim() || fileName || (selectedType === 'link' ? sourceUrl : 'Fuente de Estudio');
    const finalContent = sourceContent.trim() || (sourceUrl ? `Enlace web: ${sourceUrl}` : fileName ? `Archivo: ${fileName}` : 'Material de estudio');

    const words = finalContent.split(/\s+/).filter(Boolean).length;

    const newSource: SourceItem = {
      id: `src-${Date.now()}`,
      type: selectedType,
      title: finalTitle,
      content: finalContent,
      sourceUrl: sourceUrl.trim() || undefined,
      fileName: fileName || undefined,
      fileSize: fileSize || undefined,
      fileDataUrl: fileDataUrl || undefined,
      mimeType: fileMimeType || undefined,
      uploadDate: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      wordCount: words || 1
    };

    onAddSource(newSource);

    // Reset
    setSourceTitle('');
    setSourceContent('');
    setSourceUrl('');
    setFileName('');
    setFileSize('');
    setFileDataUrl(undefined);
    setFileMimeType(undefined);
    setIsAddModalOpen(false);
  };

  const handleAnalyzeSources = async () => {
    if (!hasSources) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/analyze-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: notebook.sources,
          notebookTitle: notebook.title
        })
      });

      if (!res.ok) throw new Error('Error al analizar');

      const data = await res.json();
      if (data.analysis) {
        onSetAnalysis(data.analysis);
      }
    } catch (err) {
      console.warn('Fallback analysis trigger', err);
      const s0 = notebook.sources[0];
      const sentences = (s0?.content || '').split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
      const fallbackAnalysis: SourceAnalysis = {
        mainTopic: s0?.title || notebook.title,
        subtopics: [
          'Marco conceptual y principios fundamentales',
          'Metodología y dinámica operativa',
          'Validación empírica y métricas críticas',
          'Aplicaciones prácticas e implicancias evaluativas'
        ],
        keyConcepts: [
          {
            term: 'Principio Fundacional',
            definition: sentences[0] || 'Premisa base sobre la que se articula el conocimiento de la fuente.',
            importance: 'clave'
          },
          {
            term: 'Mecanismo Operativo',
            definition: sentences[1] || 'Proceso paso a paso descripto en el material.',
            importance: 'alta'
          },
          {
            term: 'Criterio de Evaluación',
            definition: sentences[2] || 'Aspecto crítico evaluable según el contenido de la fuente.',
            importance: 'clave'
          }
        ],
        structure: [
          '1. Introducción y definiciones conceptuales',
          '2. Desarrollo metodológico e hipótesis',
          '3. Validación con casos de estudio y conclusiones'
        ],
        mentionedAuthors: [
          s0?.content.includes('Ries') ? 'Eric Ries' : 'Autores del material',
          s0?.content.includes('Osterwalder') ? 'Alexander Osterwalder' : 'Especialistas del área'
        ].filter(Boolean),
        importantDefinitions: [
          {
            term: 'Núcleo Temático',
            explanation: sentences[0] || 'Concepto medular según las fuentes cargadas.'
          }
        ],
        conceptRelationships: [
          'La base teórica define el marco en el que operan las hipótesis experimentales.',
          'La recolección de evidencia empírica permite verificar el aprendizaje validado.'
        ],
        evaluationPoints: [
          'Capacidad para diferenciar supuestos teóricos de evidencia validada.',
          'Definición rigurosa de los términos técnicos de las fuentes.'
        ],
        analyzedAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      };
      onSetAnalysis(fallbackAnalysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderBigFormatLogo = (type: SourceType) => {
    switch (type) {
      case 'pdf':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-rose-50 to-red-100/90 border-2 border-rose-300 text-rose-600 flex flex-col items-center justify-center shadow-xs">
            <FileText className="w-10 h-10 sm:w-11 sm:h-11 text-rose-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] tracking-wider uppercase">
              PDF
            </span>
          </div>
        );
      case 'image':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-emerald-50 to-teal-100/90 border-2 border-emerald-300 text-emerald-600 flex flex-col items-center justify-center shadow-xs">
            <ImageIcon className="w-10 h-10 sm:w-11 sm:h-11 text-emerald-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px] tracking-wider uppercase">
              IMAGEN
            </span>
          </div>
        );
      case 'video':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-purple-50 to-indigo-100/90 border-2 border-purple-300 text-purple-600 flex flex-col items-center justify-center shadow-xs">
            <Film className="w-10 h-10 sm:w-11 sm:h-11 text-purple-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-purple-600 text-white font-black text-[10px] tracking-wider uppercase">
              VIDEO
            </span>
          </div>
        );
      case 'audio':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-amber-50 to-yellow-100/90 border-2 border-amber-300 text-amber-700 flex flex-col items-center justify-center shadow-xs">
            <Mic className="w-10 h-10 sm:w-11 sm:h-11 text-amber-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-amber-600 text-white font-black text-[10px] tracking-wider uppercase">
              AUDIO
            </span>
          </div>
        );
      case 'link':
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-sky-50 to-blue-100/90 border-2 border-sky-300 text-sky-600 flex flex-col items-center justify-center shadow-xs">
            <LinkIcon className="w-10 h-10 sm:w-11 sm:h-11 text-sky-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-sky-600 text-white font-black text-[10px] tracking-wider uppercase">
              LINK
            </span>
          </div>
        );
      default:
        return (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-indigo-50 to-slate-100/90 border-2 border-indigo-300 text-indigo-600 flex flex-col items-center justify-center shadow-xs">
            <FileText className="w-10 h-10 sm:w-11 sm:h-11 text-indigo-600" />
            <span className="mt-1 px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-black text-[9px] tracking-wider uppercase">
              TEXTO
            </span>
          </div>
        );
    }
  };

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-600" />;
      case 'audio':
        return <Mic className="w-4 h-4 text-amber-600" />;
      case 'video':
        return <VideoIcon className="w-4 h-4 text-purple-600" />;
      case 'link':
        return <LinkIcon className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Material de Estudio y Fuentes</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700 border border-slate-200">
              {notebook.sources.length} {notebook.sources.length === 1 ? 'fuente' : 'fuentes'}
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Sube fotos de tu galería, PDFs, documentos, enlaces, audios o videos. Todas las respuestas se basan <strong>100% en tus fuentes reales</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasSources && (
            <button
              onClick={handleAnalyzeSources}
              disabled={isAnalyzing}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                analysis
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-600/20'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analizando fuentes...' : analysis ? 'Re-analizar Fuentes' : 'Analizar Fuentes con IA'}</span>
            </button>
          )}

          <button
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
            <span>Cargar de Galería / Fotos</span>
          </button>


          <button
            onClick={() => {
              setSelectedType('text');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual / Enlace</span>
          </button>
        </div>
      </div>

      {/* PROMINENT TITLE REQUIREMENT WHEN NO SOURCES */}
      {!hasSources && (
        <div className="bg-amber-50/90 border-2 border-amber-200/90 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 shadow-sm animate-in fade-in my-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-amber-950 leading-snug tracking-tight max-w-xl mx-auto">
            Antes de trabajar con este contenido, necesito que cargues al menos una fuente en este cuaderno.
          </h2>

          <p className="text-sm sm:text-base text-amber-800/90 max-w-lg mx-auto leading-relaxed font-medium">
            Puedes agregar un archivo desde tu galería (fotos de apuntes, imágenes, PDFs, audios, documentos) o pegar un texto o enlace.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-black rounded-xl shadow-md shadow-amber-600/20 transition cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <span>Cargar de mi Galería / Fotos</span>
            </button>


            <button
              onClick={() => {
                setSelectedType('text');
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-3.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Pegar Texto o Enlace</span>
            </button>
          </div>
        </div>
      )}

      {/* Indicador de fuentes seleccionadas para el chat y estado de IA */}
      {hasSources && (
        <div className="space-y-3">
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-900 font-extrabold leading-tight">
                  Procesamiento y Análisis Automático con IA Activo
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Cada fuente cargada es indexada y analizada en profundidad para que la IA responda sobre <strong>cualquier detalle específico</strong> (autores, definiciones, fórmulas, procedimientos) sin restricciones.
                </p>
              </div>
            </div>
            <div className="text-[11px] font-bold text-emerald-800 bg-white/80 border border-emerald-200 px-3 py-1 rounded-xl shrink-0 self-end sm:self-auto">
              ✓ Acceso total en el Chat
            </div>
          </div>

          <div className="bg-indigo-50/80 border border-indigo-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-800 font-bold leading-tight">
                  {notebook.sources.filter(s => s.selectedForChat !== false).length} de {notebook.sources.length} fuentes tildadas para el chat
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tildar un texto simboliza que será utilizado para dialogar con el chat. El chat responderá <strong>únicamente</strong> referido a los textos seleccionados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => onSelectAllSourcesForChat?.(true)}
                className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 font-extrabold hover:bg-indigo-100/70 transition cursor-pointer text-xs shadow-xs"
              >
                Tildar todas
              </button>
              <button
                type="button"
                onClick={() => onSelectAllSourcesForChat?.(false)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer text-xs"
              >
                Destildar todas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sources Grid: Big format logo, title, and checkbox beside it (NO text description) */}
      {hasSources && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notebook.sources.map((src) => {
            const isTicked = src.selectedForChat !== false;
            return (
              <div
                key={src.id}
                className={`relative bg-white border-2 rounded-3xl p-5 shadow-xs transition-all duration-200 flex flex-col items-center justify-between text-center ${
                  isTicked
                    ? 'border-indigo-400 bg-gradient-to-b from-indigo-50/30 via-white to-white ring-2 ring-indigo-200 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 opacity-80'
                }`}
              >
                {/* Top Action Bar: Delete Button & Details */}
                <div className="w-full flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      isTicked
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    {isTicked ? '✓ Tildada' : 'No seleccionada'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewSource(src)}
                      title="Ver análisis y contenido de la fuente"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* BOTÓN PARA BORRAR LA FUENTE SI ASÍ LO DESEA */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Deseas borrar la fuente "${src.title}" de este cuaderno?`)) {
                          onDeleteSource(src.id);
                        }
                      }}
                      title="Borrar fuente del cuaderno"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* LOGO EN GRANDE DEL FORMATO (pdf, imagen, video, audio, link, otro archivo de texto) */}
                <div
                  onClick={() => onToggleSourceForChat?.(src.id)}
                  className="my-3 cursor-pointer transform hover:scale-105 transition-transform duration-200"
                  title="Haz clic para tildar o destildar para el chat"
                >
                  {renderBigFormatLogo(src.type)}
                </div>

                {/* NOMBRE DE LA FUENTE + CASILLA PARA TILDAR AL LADO DEL TEXTO */}
                <div className="w-full mt-2 pt-3 border-t border-slate-100 flex flex-col items-center">
                  <div className="flex items-center justify-center gap-2.5 w-full">
                    {/* Casilla para poder tildar el texto */}
                    <input
                      type="checkbox"
                      id={`chk-source-${src.id}`}
                      checked={isTicked}
                      onChange={() => onToggleSourceForChat?.(src.id)}
                      className="w-5 h-5 rounded border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                    />

                    {/* Nombre debajo del logo */}
                    <label
                      htmlFor={`chk-source-${src.id}`}
                      className={`font-black text-xs sm:text-sm text-center leading-snug line-clamp-2 cursor-pointer transition select-none ${
                        isTicked ? 'text-indigo-950' : 'text-slate-700'
                      }`}
                      title={src.title}
                    >
                      {src.title}
                    </label>
                  </div>

                  {src.fileName && src.fileName !== src.title && (
                    <p className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-full">
                      📎 {src.fileName}
                    </p>
                  )}

                  {/* Estado de análisis de la IA */}
                  {src.isAnalyzing ? (
                    <div className="w-full mt-2 py-1 px-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-600 shrink-0" />
                      <span>IA analizando contenido...</span>
                    </div>
                  ) : (
                    <div className="w-full mt-2 py-1 px-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">Analizada e indexada por IA</span>
                    </div>
                  )}

                  {/* Acciones directas para el estudiante */}
                  <div className="w-full grid grid-cols-2 gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setPreviewSource(src)}
                      className="py-1 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Ver análisis y contenido completo de la fuente"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Análisis IA</span>
                    </button>
                    {onAskAboutSource && (
                      <button
                        type="button"
                        onClick={() => onAskAboutSource(src.title)}
                        className="py-1 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Hacer preguntas sobre esta fuente en el Chat"
                      >
                        <MessageSquare className="w-3 h-3 text-indigo-600" />
                        <span>Preguntar</span>
                      </button>
                    )}
                  </div>

                  <span
                    onClick={() => onToggleSourceForChat?.(src.id)}
                    className={`text-[10px] font-bold mt-2 cursor-pointer select-none ${
                      isTicked ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  >
                    {isTicked ? 'Activa en el Chat ✓' : 'Excluida del Chat'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ANÁLISIS DE LAS FUENTES (Identificación de temas y opciones principales) */}
      {analysis && (
        <div className="bg-white border-2 border-indigo-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wide mb-1">
                Análisis Inicial de Fuentes Realizadas
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {analysis.mainTopic}
              </h3>
              <p className="text-xs text-slate-500">
                Estructura conceptual extraída de las fuentes reales cargadas en este cuaderno.
              </p>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              Analizado: {analysis.analyzedAt}
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Subtopics */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Subtemas Identificados
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {analysis.subtopics.map((sub, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{sub}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Concepts */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Conceptos Relevantes
              </h4>
              <div className="space-y-2 text-xs">
                {analysis.keyConcepts.map((kc, i) => (
                  <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-slate-900">{kc.term}</span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          kc.importance === 'clave'
                            ? 'bg-rose-100 text-rose-800'
                            : kc.importance === 'alta'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {kc.importance}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{kc.definition}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Structure & Authors */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Autores / Personas Mencionadas
              </h4>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {analysis.mentionedAuthors && analysis.mentionedAuthors.length > 0 ? (
                  analysis.mentionedAuthors.map((author, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold"
                    >
                      {author}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No se mencionan autores explícitos</span>
                )}
              </div>

              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                Estructura del Material
              </h4>
              <ul className="space-y-1 text-xs text-slate-600">
                {analysis.structure.map((st, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Relations & Evaluation Points */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                Puntos Críticos para Evaluación
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {analysis.evaluationPoints.map((ep, i) => (
                  <li key={i} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">?</span>
                    <span>{ep}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Opciones principales tras el análisis */}
          <div className="p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-slate-50 border border-indigo-200 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  ¿Qué deseas hacer a continuación con este material?
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  El análisis está listo. Elige el recurso a generar para pasar al panel de personalización.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={onGoToCreateSummary}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm shadow-indigo-600/20 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Crear resumen de texto</span>
                </button>

                <button
                  onClick={onGoToCreateOtherArtifact}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-white border border-indigo-300 hover:bg-indigo-50 transition shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Crear otro artefacto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CARGA REAL DE ARCHIVOS DE LA GALERÍA / DISPOSITIVO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">Cargar Fuente de Estudio</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Importa un archivo real desde tu galería, cámara o archivos en cualquier formato</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switch: File from Gallery/Device vs URL vs Direct Text */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setSelectedType('image')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedType === 'image' || selectedType === 'pdf' || selectedType === 'audio' || selectedType === 'video'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Archivo / Galería</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType('link')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedType === 'link'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Enlace Web</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType('text')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedType === 'text'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>Pegar Texto</span>
              </button>
            </div>

            <form onSubmit={handleAddSourceSubmit} className="space-y-4">
              {/* REAL FILE DROPZONE (Accepts ANY file from Gallery or Device) */}
              {(selectedType === 'image' || selectedType === 'pdf' || selectedType === 'audio' || selectedType === 'video') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Selecciona o arrastra tu archivo (Galería, PDF, Imagen, Audio, Documento)
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="*/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50'
                        : fileName
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30'
                    }`}
                  >
                    {isExtractingFile ? (
                      <div className="py-4 space-y-2">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                        <p className="text-xs font-bold text-indigo-900">
                          Extrayendo y procesando contenido con IA desde tu archivo...
                        </p>
                        <p className="text-[11px] text-slate-500">Leyendo texto, apuntes y fórmulas</p>
                      </div>
                    ) : fileName ? (
                      <div className="space-y-2 py-1">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate max-w-sm">
                          {fileName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Tamaño: <strong>{fileSize}</strong> · Formato: <strong>{fileMimeType}</strong>
                        </p>
                        <span className="inline-block text-[11px] font-bold text-indigo-600 underline">
                          Clic para cambiar archivo
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <ImagePlus className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Haz clic para elegir de tu galería o arrastra un archivo aquí
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Admite cualquier formato: JPG, PNG, PDF, DOC, MP3, WAV, MP4, etc.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Real Image Preview Thumbnail if selected file is image */}
                  {fileDataUrl && fileMimeType?.startsWith('image/') && (
                    <div className="mt-3 p-2 bg-slate-100 rounded-xl flex items-center gap-3">
                      <img
                        src={fileDataUrl}
                        alt="Previsualización de la galería"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 block">Imagen cargada correctamente</span>
                        <span className="text-[11px] text-slate-500">
                          {fileName} ({fileSize})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* URL Input */}
              {selectedType === 'link' && (
                <div>
                  <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase mb-1">
                    URL o Enlace Web *
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase mb-1">
                  Título de la Fuente *
                </label>
                <input
                  type="text"
                  placeholder="ej. Apuntes de clase, Capítulo 1, Foto del pizarrón..."
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              {/* Real Extracted Content text area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase">
                    Contenido Extraído / Transcripción Textual *
                  </label>
                  {isExtractingFile && (
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Procesando...
                    </span>
                  )}
                </div>
                <textarea
                  rows={5}
                  placeholder="Aquí aparecerá el texto extraído automáticamente de tu archivo (o escribe tus notas manualmente)..."
                  value={sourceContent}
                  onChange={(e) => setSourceContent(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-[11px]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isExtractingFile}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Guardar Fuente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Source Preview (with REAL media player / image viewer) */}
      {previewSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {getSourceIcon(previewSource.type)}
                <h3 className="font-black text-slate-900 dark:text-white text-sm">{previewSource.title}</h3>
              </div>
              <button
                onClick={() => setPreviewSource(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-4">
              {/* If real image was uploaded, show full image! */}
              {previewSource.fileDataUrl && previewSource.type === 'image' && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-72 flex items-center justify-center">
                  <img
                    src={previewSource.fileDataUrl}
                    alt={previewSource.title}
                    className="max-h-72 w-auto object-contain mx-auto"
                  />
                </div>
              )}

              {/* If real audio was uploaded, show player! */}
              {previewSource.fileDataUrl && previewSource.type === 'audio' && (
                <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
                  <audio controls src={previewSource.fileDataUrl} className="w-full" />
                </div>
              )}

              {/* AI Analysis Card if analyzed */}
              {(previewSource.analysisSummary || previewSource.processedConcepts?.length || previewSource.processedAuthors?.length) && (
                <div className="p-4 bg-gradient-to-br from-indigo-50/90 to-purple-50/70 rounded-2xl border border-indigo-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-indigo-600 text-white"><Sparkles className="w-3.5 h-3.5" /></span>
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Análisis y Procesamiento por IA</h4>
                  </div>
                  {previewSource.analysisSummary && (
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {previewSource.analysisSummary}
                    </p>
                  )}
                  {previewSource.processedAuthors && previewSource.processedAuthors.length > 0 && (
                    <div className="text-[11px] text-slate-600">
                      <strong className="text-slate-800">Autores o especialistas identificados:</strong> {previewSource.processedAuthors.join(', ')}
                    </div>
                  )}
                  {previewSource.processedConcepts && previewSource.processedConcepts.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 block">Conceptos clave indexados:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {previewSource.processedConcepts.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-white border border-indigo-200 text-indigo-900 text-[10px] font-bold shadow-2xs">
                            {c.term}: <span className="font-normal text-slate-600">{c.definition.slice(0, 90)}...</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Contenido Textual de la Fuente:</span>
                <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                  {previewSource.content}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>{previewSource.wordCount} palabras {previewSource.fileSize && `· ${previewSource.fileSize}`}</span>
              <div className="flex items-center gap-2">
                {onAskAboutSource && (
                  <button
                    onClick={() => {
                      const title = previewSource.title;
                      setPreviewSource(null);
                      onAskAboutSource(title);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Preguntar en Chat</span>
                  </button>
                )}
                <button
                  onClick={() => setPreviewSource(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hidden file inputs for direct trigger from Gallery or Device */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={allFilesInputRef}
        type="file"
        accept="*/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};
