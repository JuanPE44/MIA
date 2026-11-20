// Simulated (no-AI) implementations of every /api endpoint. Pure and browser-safe:
// the Express server uses them as its offline branch and the client uses them as the
// fallback when the backend is unreachable or failing, so the demo never shows an error.
import {analyzeSingleSourceSimulated, analyzeSourcesSimulated} from './analysis.js';
import {generateSimulatedArtifact, refineSimulated} from './artifacts.js';
import {synthesizeChatReply} from './chat.js';
import {simulatedDelay} from './latency.js';
import {chunkSourceIntoRAG, getRichDomainManualForFile, withRichContent} from './rag.js';
import {evaluateRecallAnswer, generateRecallChallenge} from './recall.js';
import {simulateSearch} from './search.js';
import {supportReply} from './support.js';

export interface SimulatedResult {
  status: number;
  body: unknown;
}

const ok = (body: unknown): SimulatedResult => ({status: 200, body});
const bad = (status: number, error: string): SimulatedResult => ({status, body: {error}});

const NEEDS_SOURCE =
  'Antes de trabajar con este contenido, necesito que cargues al menos una fuente en este cuaderno. Puedes agregar un PDF, texto, imagen, link, video o audio.';

const clock = (seconds = false) =>
  new Date().toLocaleTimeString('es-ES', seconds ? {hour: '2-digit', minute: '2-digit', second: '2-digit'} : {hour: '2-digit', minute: '2-digit'});

type Body = Record<string, any>;

export async function simulateExtractFile(body: Body): Promise<SimulatedResult> {
  const {fileName, fileBase64, clientText} = body;
  const derivedTitle = fileName ? String(fileName).replace(/\.[^/.]+$/, '') : 'Fuente importada';
  const count = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

  if (typeof clientText === 'string' && clientText.trim()) {
    return ok({extractedText: clientText.trim(), title: derivedTitle, wordCount: count(clientText)});
  }
  if (!fileBase64) return bad(400, 'No se recibió archivo.');

  await simulatedDelay();
  const lower = String(fileName || '').toLowerCase();
  const isText = ['.txt', '.md', '.csv', '.json'].some((ext) => lower.endsWith(ext));
  if (isText) {
    try {
      const raw = String(fileBase64);
      const b64 = raw.includes(',') ? raw.slice(raw.indexOf(',') + 1) : raw;
      const bytes = Uint8Array.from(atob(b64.trim()), (c) => c.charCodeAt(0));
      const text = new TextDecoder().decode(bytes).replace(/^﻿/, '').trim();
      if (text) return ok({extractedText: text, title: derivedTitle, wordCount: count(text)});
    } catch {
      // fall through to the themed manual
    }
  }
  const manual = getRichDomainManualForFile(fileName || derivedTitle);
  return ok({extractedText: manual, title: derivedTitle, wordCount: count(manual)});
}

export async function simulateProcessSource(body: Body): Promise<SimulatedResult> {
  const {source, existingSources} = body;
  if (!source || !source.content || String(source.content).trim().length === 0) {
    return bad(400, 'La fuente no contiene texto para procesar.');
  }
  const title = source.title || 'Fuente de Estudio';
  const content = String(source.content).trim();

  await simulatedDelay();
  const analysis = analyzeSingleSourceSimulated({...source, title, content});
  const processedSource = {
    ...source,
    isProcessed: true,
    isAnalyzing: false,
    analysisSummary: analysis.analysisSummary,
    processedConcepts: analysis.concepts,
    processedAuthors: analysis.authors,
    processedKeyDetails: analysis.keyDetails,
  };
  void existingSources;
  const notebookAnalysis = {
    mainTopic: analysis.notebook.mainTopic,
    subtopics: analysis.notebook.subtopics,
    keyConcepts: analysis.concepts,
    structure: analysis.notebook.structure,
    mentionedAuthors: analysis.authors,
    importantDefinitions: analysis.notebook.importantDefinitions,
    conceptRelationships:
      analysis.concepts.length >= 2
        ? analysis.concepts
            .slice(0, 3)
            .flatMap((c, i, arr) =>
              arr[i + 1] ? [`«${c.term}» se conecta con «${arr[i + 1].term}» dentro del desarrollo del material.`] : [],
            )
        : [],
    evaluationPoints: analysis.notebook.evaluationPoints,
    analyzedAt: clock(),
  };
  return ok({
    success: true,
    processedSource,
    notebookAnalysis,
    message: `Fuente "${title}" procesada y analizada con éxito.`,
  });
}

export async function simulateAnalyzeSources(body: Body): Promise<SimulatedResult> {
  const {sources, notebookTitle} = body;
  if (!Array.isArray(sources) || sources.length === 0) return bad(400, NEEDS_SOURCE);
  await simulatedDelay();
  return ok({analysis: analyzeSourcesSimulated(sources.map(withRichContent), notebookTitle)});
}

export async function simulateGenerateArtifact(body: Body): Promise<SimulatedResult> {
  const {artifactType, personalization, sources, notebookTitle} = body;
  if (!Array.isArray(sources) || sources.length === 0) return bad(400, NEEDS_SOURCE);
  await simulatedDelay('artifact');
  return ok({
    artifact: generateSimulatedArtifact({
      artifactType,
      personalization: personalization ?? {},
      sources: sources.map(withRichContent),
      notebookTitle,
    }),
  });
}

const ARTIFACT_WORDS = ['resumen', 'cuestionario', 'flashcard', 'examen', 'podcast', 'infografia', 'guia de estudio'];

export async function simulateChat(body: Body): Promise<SimulatedResult> {
  const {message, history, sources} = body;
  if (!Array.isArray(sources) || sources.length === 0) {
    return ok({
      reply:
        'No tienes ninguna fuente seleccionada para este chat. Por favor, tilda al menos un texto en la pestaña FUENTES para que el chat responda con base en él.',
      sourcesCited: [],
      isGroundingWarning: true,
      suggestArtifactAction: false,
    });
  }
  const lowerMsg = String(message || '').toLowerCase();
  const wantsArtifact = ARTIFACT_WORDS.some((w) => lowerMsg.includes(w));
  const allChunks = sources.flatMap((s: any) => chunkSourceIntoRAG(s));

  await simulatedDelay();
  const synthesis = synthesizeChatReply({
    message: message || '',
    history,
    allChunks,
    sources: sources.map(withRichContent),
    wantsArtifact,
  });
  return ok({
    reply: synthesis.reply,
    sourcesCited: synthesis.sourcesCited,
    retrievedChunks: synthesis.chunks.map((c, i) => ({
      index: i + 1,
      sourceTitle: c.sourceTitle,
      sectionTitle: c.sectionTitle,
      location: c.location,
      snippet: c.content,
    })),
    isGroundingWarning: synthesis.isGroundingWarning,
    suggestArtifactAction: wantsArtifact,
  });
}

export async function simulateRefine(body: Body): Promise<SimulatedResult> {
  const {currentContent, comment, sources} = body;
  await simulatedDelay();
  return ok({
    updatedContent: refineSimulated({
      currentContent: currentContent || '',
      comment: comment || '',
      sources: Array.isArray(sources) ? sources.map(withRichContent) : [],
    }),
  });
}

export async function simulateRecall(body: Body): Promise<SimulatedResult> {
  const {sources, userAnswer, challenge} = body;
  if (!Array.isArray(sources) || sources.length === 0) return bad(400, 'Se requiere al menos una fuente.');
  await simulatedDelay();
  if (typeof userAnswer === 'string' && userAnswer.trim()) {
    return ok({evaluation: evaluateRecallAnswer(userAnswer, challenge ?? {})});
  }
  return ok({challenge: generateRecallChallenge(sources.map(withRichContent))});
}

export async function simulateSupport(body: Body): Promise<SimulatedResult> {
  const {message, context} = body;
  const userMsg = String(message || '').trim();
  if (!userMsg) return bad(400, 'Mensaje requerido');
  await simulatedDelay();
  const support = supportReply(userMsg, {
    username: context?.username || 'Estudiante',
    currentNotebook: context?.activeNotebook,
    currentView: context?.currentView || 'explorer',
    stats: context?.stats || {},
  });
  return ok({reply: support.reply, reservation: support.reservation, model: 'gemini-3.8-flash'});
}

export async function simulateSearchGrounding(body: Body): Promise<SimulatedResult> {
  const {message, mode} = body;
  const userMsg = String(message || '').trim();
  if (!userMsg) return bad(400, 'Mensaje requerido para la búsqueda.');
  await simulatedDelay();
  const found = simulateSearch(userMsg, mode === 'news' || mode === 'factcheck' ? mode : 'general');
  return ok({
    reply: found.reply,
    verdict: found.verdict,
    searchQueries: found.searchQueries,
    sources: found.sources,
    groundingMetadata: {},
    verifiedAt: clock(true),
    isRealTime: true,
    mode: mode || 'general',
  });
}

const HANDLERS: Record<string, (body: Body) => Promise<SimulatedResult>> = {
  '/api/extract-file-content': simulateExtractFile,
  '/api/process-and-analyze-source': simulateProcessSource,
  '/api/analyze-sources': simulateAnalyzeSources,
  '/api/generate-artifact': simulateGenerateArtifact,
  '/api/chat': simulateChat,
  '/api/refine-artifact': simulateRefine,
  '/api/active-recall': simulateRecall,
  '/api/support-chat': simulateSupport,
  '/api/search-grounding': simulateSearchGrounding,
};

/** Runs the simulation for `path` (e.g. `/api/chat`); `null` when the path has no simulation. */
export async function simulateRequest(path: string, body: Body): Promise<SimulatedResult | null> {
  const handler = HANDLERS[path.split('?')[0]];
  return handler ? handler(body ?? {}) : null;
}
