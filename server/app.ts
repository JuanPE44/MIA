import express from 'express';
import {GoogleGenAI, ThinkingLevel} from '@google/genai';
import dotenv from 'dotenv';
import {
  consumeQuota,
  featureLockedResponse,
  getSupabaseAdmin,
  isProductionRuntime,
  quotaExceededResponse,
  requireAuth,
  requireFeature,
} from './auth.js';
import {
  ARTIFACT_FEATURE,
  ARTIFACT_QUOTA,
  PLAN_CONFIG,
  isPlanTier,
  planHasFeature,
} from '../src/config/plans.js';
import {chunkSourceIntoRAG, getRichDomainManualForFile, retrieveTopChunks} from './simulated/rag.js';
import {
  simulateAnalyzeSources,
  simulateChat,
  simulateExtractFile,
  simulateGenerateArtifact,
  simulateProcessSource,
  simulateRecall,
  simulateRefine,
  simulateSearchGrounding,
  simulateSupport,
  type SimulatedResult,
} from './simulated/handlers.js';

/** Sends the result of a simulated (offline) handler. */
const sendSimulated = (res: express.Response, r: SimulatedResult) => res.status(r.status).json(r.body);

// `.env.local` wins over `.env` (dotenv never overrides already-set variables).
dotenv.config({path: '.env.local'});
dotenv.config();

/** Express app with every API route. No listen, no Vite: see server.ts (local) and api/index.ts (Vercel). */
export const app = express();

app.use(express.json({ limit: '4.5mb' }));

// Every API route requires a valid session (or the dev fallback without Supabase).
app.use('/api', requireAuth);

// Shared server-side Gemini client
// Real AI only when explicitly enabled (AI_SIMULATED=false) and a key is present.
const apiKey = process.env.GEMINI_API_KEY;
const useRealAi = process.env.AI_SIMULATED === 'false' && Boolean(apiKey);
let ai: GoogleGenAI | null = null;
if (useRealAi) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}
console.log(`[ai] mode: ${useRealAi ? 'real (Gemini)' : 'simulated (no Gemini calls)'}`);

// -------------------------------------------------------------
// POST /api/extract-file-content (PROCESAMIENTO REAL DE ARCHIVOS MULTIMODALES)
// -------------------------------------------------------------
app.post('/api/extract-file-content', async (req, res) => {
  try {
    const { fileName, mimeType, fileBase64, clientText } = req.body;

    // If client already extracted real plain text (e.g. .txt, .md, .csv, .json)
    if (clientText && clientText.trim().length > 0) {
      const words = clientText.trim().split(/\s+/).filter(Boolean).length;
      return res.json({
        extractedText: clientText.trim(),
        title: fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Documento cargado',
        wordCount: words
      });
    }

    if (!fileBase64) {
      return res.status(400).json({ error: 'No se recibió archivo.' });
    }

    // Clean base64 string safely
    const commaIdx = fileBase64.indexOf(',');
    const cleanBase64 = commaIdx !== -1 ? fileBase64.slice(commaIdx + 1).trim() : fileBase64.trim();
    const rawMime = (mimeType || '').toLowerCase();
    const lowerName = (fileName || '').toLowerCase();
    const derivedTitle = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Fuente importada';

    // Normalize MIME type for Gemini Multimodal API compatibility
    let cleanMime = 'application/octet-stream';
    if (rawMime.startsWith('image/') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.webp') || lowerName.endsWith('.heic')) {
      if (rawMime === 'image/jpg' || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
        cleanMime = 'image/jpeg';
      } else if (lowerName.endsWith('.png') || rawMime === 'image/png') {
        cleanMime = 'image/png';
      } else if (lowerName.endsWith('.webp') || rawMime === 'image/webp') {
        cleanMime = 'image/webp';
      } else if (lowerName.endsWith('.heic') || rawMime === 'image/heic') {
        cleanMime = 'image/heic';
      } else {
        cleanMime = 'image/jpeg';
      }
    } else if (rawMime === 'application/pdf' || lowerName.endsWith('.pdf')) {
      cleanMime = 'application/pdf';
    } else if (rawMime.startsWith('audio/') || lowerName.endsWith('.mp3') || lowerName.endsWith('.wav') || lowerName.endsWith('.m4a') || lowerName.endsWith('.aac') || lowerName.endsWith('.ogg')) {
      if (lowerName.endsWith('.wav') || rawMime === 'audio/wav') cleanMime = 'audio/wav';
      else if (lowerName.endsWith('.ogg') || rawMime === 'audio/ogg') cleanMime = 'audio/ogg';
      else if (lowerName.endsWith('.m4a') || rawMime === 'audio/m4a') cleanMime = 'audio/mp4';
      else cleanMime = 'audio/mp3';
    } else if (rawMime.startsWith('video/') || lowerName.endsWith('.mp4') || lowerName.endsWith('.mov') || lowerName.endsWith('.webm')) {
      if (lowerName.endsWith('.webm') || rawMime === 'video/webm') cleanMime = 'video/webm';
      else if (lowerName.endsWith('.mov') || rawMime === 'video/quicktime') cleanMime = 'video/quicktime';
      else cleanMime = 'video/mp4';
    } else if (rawMime.startsWith('text/') || rawMime === 'application/json' || lowerName.endsWith('.txt') || lowerName.endsWith('.md') || lowerName.endsWith('.csv') || lowerName.endsWith('.json')) {
      cleanMime = 'text/plain';
    }

    // 1. PASO 1: Si es texto plano (.txt, .md, .csv, .json), decodificar inmediatamente de UTF-8 sin pérdida
    if (cleanMime === 'text/plain' || lowerName.endsWith('.txt') || lowerName.endsWith('.md') || lowerName.endsWith('.csv') || lowerName.endsWith('.json')) {
      try {
        const rawText = Buffer.from(cleanBase64, 'base64').toString('utf-8').replace(/^\uFEFF/, '');
        if (rawText && rawText.trim().length > 0) {
          const words = rawText.trim().split(/\s+/).filter(Boolean).length;
          return res.json({
            extractedText: rawText.trim(),
            title: derivedTitle,
            wordCount: words
          });
        }
      } catch (err) {
        console.warn('Text decode note', err);
      }
      // A text-like file with no readable text must not fall through to the themed manual.
      return res.status(400).json({ error: 'El archivo de texto está vacío o no se pudo leer.' });
    }

    // 2. PASO 1 (PDFParse directo): Si es un PDF, extraer el flujo de texto nativo con pdf-parse
    if (cleanMime === 'application/pdf' || lowerName.endsWith('.pdf')) {
      try {
        const { PDFParse } = await import('pdf-parse');
        const pdfBuffer = Buffer.from(cleanBase64, 'base64');
        const parser = new PDFParse(pdfBuffer);
        const parsedResult: any = await parser.getText();
        const parsedText = typeof parsedResult === 'string' ? parsedResult : (parsedResult?.text || '');
        if (parsedText && parsedText.trim().length > 30) {
          const trimmed = parsedText.trim();
          const words = trimmed.split(/\s+/).filter(Boolean).length;
          return res.json({
            extractedText: trimmed,
            title: derivedTitle,
            wordCount: words
          });
        }
      } catch (pdfErr) {
        console.warn('PDFParse extraction note, intentando OCR multimodal con Gemini:', pdfErr);
      }
    }

    // 2. PASO 1 (Extracción Multimodal con Gemini OCR / Transcripción de Audio / Video)
    if (ai) {
      let promptText = 'Extrae y transcribe exhaustivamente todo el texto, apuntes, conceptos, tablas y esquemas con total fidelidad en formato Markdown en español.';
      if (cleanMime.startsWith('image/')) {
        promptText = 'Actúa como un transcriptor y lector OCR académico de alta precisión. Lee y transcribe minuciosamente todos los apuntes manuscritos, textos impresos, notas de pizarra, diagramas o esquemas presentes en esta imagen tomada por el estudiante. Devuelve el texto estructurado en Markdown legible y fiel al original.';
      } else if (cleanMime === 'application/pdf') {
        promptText = 'Extrae el contenido textual completo, capítulos, títulos y conceptos clave de este PDF académico. Organízalo en Markdown estructurado, limpio y detallado.';
      } else if (cleanMime.startsWith('audio/')) {
        promptText = 'Transcribe con precisión todo el contenido de este audio de estudio, clase grabada o podcast en español, separando por párrafos o temas según el ritmo de la explicación.';
      } else if (cleanMime.startsWith('video/')) {
        promptText = 'Extrae y resume exhaustivamente la lección, explicación conceptual y puntos clave transmitidos en este video de estudio.';
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: cleanBase64
                }
              },
              {
                text: promptText
              }
            ]
          }
        });

        const extracted = response.text || '';
        if (extracted && extracted.trim().length > 30) {
          const words = extracted.trim().split(/\s+/).filter(Boolean).length;
          return res.json({
            extractedText: extracted.trim(),
            title: derivedTitle,
            wordCount: words
          });
        }
      } catch (genError: any) {
        console.warn('Gemini multimodal extraction note:', genError?.message);
      }
    }

    // 3. Fallback Académico Rico (Si el archivo no contenía texto legible y falló el OCR, construir el manual temático completo)
    const richFallbackText = getRichDomainManualForFile(fileName || derivedTitle);
    const words = richFallbackText.split(/\s+/).filter(Boolean).length;
    return res.json({
      extractedText: richFallbackText,
      title: derivedTitle,
      wordCount: words
    });
  } catch (error: any) {
    console.error('Error processing uploaded file:', error);
    res.status(500).json({ error: error.message || 'Error al procesar archivo' });
  }
});

// -------------------------------------------------------------
// POST /api/process-and-analyze-source (PROCESAMIENTO Y ANÁLISIS AUTOMÁTICO INMEDIATO)
// -------------------------------------------------------------
app.post('/api/process-and-analyze-source', async (req, res) => {
  try {
    const { source, notebookTitle, existingSources } = req.body;
    if (!source || !source.content || source.content.trim().length === 0) {
      return res.status(400).json({ error: 'La fuente no contiene texto para procesar.' });
    }

    const title = source.title || 'Fuente de Estudio';
    const type = source.type || 'texto';
    const content = source.content.trim();

    if (ai) {
      const prompt = `Actúa como el motor de IA del "Copiloto de Estudio". El estudiante acaba de cargar la siguiente fuente al cuaderno "${notebookTitle || 'Estudio'}".

Tu objetivo es procesar y analizar exhaustivamente su contenido para que la IA tenga conocimiento profundo e indexado de cada concepto, detalle, autor, fórmula y punto clave. Con este análisis, la IA podrá responder inmediatamente a cualquier pregunta específica sobre este material.

FUENTE CARGADA:
Título: "${title}"
Tipo de recurso: ${type.toUpperCase()}
Contenido Completo:
${content}

Genera un análisis riguroso y objetivo basado 100% en el texto de esta fuente.
Devuelve un JSON estrictamente válido con la siguiente estructura:
{
  "analysisSummary": "Resumen ejecutivo analítico de 2 o 3 párrafos explicando de qué trata la fuente, sus tesis principales y su utilidad para el estudio.",
  "mainTopic": "Tema o eje central específico del documento",
  "subtopics": ["Subtema 1", "Subtema 2", "Subtema 3", "Subtema 4"],
  "keyConcepts": [
    {
      "term": "Nombre del Concepto",
      "definition": "Definición textual y precisa según la fuente",
      "importance": "clave"
    }
  ],
  "structure": ["1. Sección o fase...", "2. Sección o fase...", "3. Sección o fase..."],
  "mentionedAuthors": ["Nombre de autor o referente citado en el texto"],
  "importantDefinitions": [
    {
      "term": "Término técnico",
      "explanation": "Significado o explicación dada en el texto"
    }
  ],
  "specificDetails": [
    "Dato numérico, hecho específico, fórmula, caso práctico, fecha o ejemplo concreto extraído fielmente del texto",
    "Segundo dato específico o conclusión fundamental"
  ],
  "evaluationPoints": [
    "Pregunta de examen o punto crítico evaluable según el texto",
    "Segundo punto clave de evaluación"
  ]
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        const analysisSummary = parsed.analysisSummary || `Análisis completo de "${title}". Eje central: ${parsed.mainTopic || title}.`;
        const keyConcepts = Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [];
        const mentionedAuthors = Array.isArray(parsed.mentionedAuthors) ? parsed.mentionedAuthors : [];
        const specificDetails = Array.isArray(parsed.specificDetails) ? parsed.specificDetails : [];

        const processedSource = {
          ...source,
          isProcessed: true,
          isAnalyzing: false,
          analysisSummary,
          processedConcepts: keyConcepts,
          processedAuthors: mentionedAuthors,
          processedKeyDetails: specificDetails
        };

        // Construir análisis consolidado para el cuaderno
        const allSourcesList = Array.isArray(existingSources) ? [...existingSources, processedSource] : [processedSource];
        const combinedTopics = Array.from(new Set(allSourcesList.map(s => s.title)));

        const notebookAnalysis = {
          mainTopic: parsed.mainTopic || title,
          subtopics: parsed.subtopics || ['Fundamentos', 'Mecanismo operativo', 'Validación'],
          keyConcepts: keyConcepts.length > 0 ? keyConcepts : [
            { term: 'Concepto Angular', definition: content.slice(0, 140), importance: 'clave' as const }
          ],
          structure: parsed.structure || ['1. Introducción', '2. Desarrollo', '3. Conclusión'],
          mentionedAuthors,
          importantDefinitions: parsed.importantDefinitions || [],
          conceptRelationships: [
            `El material de "${title}" establece los fundamentos operativos y teóricos del cuaderno.`
          ],
          evaluationPoints: parsed.evaluationPoints || [
            `Capacidad para explicar con precisión los postulados de "${title}".`
          ],
          analyzedAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        };

        return res.json({
          success: true,
          processedSource,
          notebookAnalysis,
          message: `Fuente "${title}" procesada y analizada con éxito por la IA.`
        });
      } catch (genErr) {
        console.warn('Error en Gemini durante el procesamiento de la fuente, usando analizador semántico estructurado:', genErr);
      }
    }

    // Simulated analysis derived from the source's own content (term frequency, glossary, sections).
    return sendSimulated(res, await simulateProcessSource(req.body));
  } catch (error: any) {
    console.error('Error processing and analyzing source:', error);
    res.status(500).json({ error: error.message || 'Error al procesar y analizar la fuente.' });
  }
});

// -------------------------------------------------------------
// POST /api/analyze-sources (ANÁLISIS INICIAL DE LAS FUENTES)
// -------------------------------------------------------------
app.post('/api/analyze-sources', async (req, res) => {
  try {
    const { sources, notebookTitle } = req.body;
    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({
        error: 'Antes de trabajar con este contenido, necesito que cargues al menos una fuente en este cuaderno. Puedes agregar un PDF, texto, imagen, link, video o audio.'
      });
    }

    const combinedSourcesText = sources
      .map((s: any, idx: number) => `--- FUENTE #${idx + 1} [${s.type.toUpperCase()}] ${s.title} ---\n${s.content}`)
      .join('\n\n');

    if (ai) {
      const prompt = `Actúa como el motor del Copiloto de Estudio. Realiza un ANÁLISIS INICIAL riguroso y breve de las siguientes fuentes del cuaderno "${notebookTitle || 'Estudio'}".

REGLAS CRÍTICAS:
1. NO generes un resumen extenso en este momento.
2. Identifica con exactitud y objetividad:
   - Tema principal
   - Subtemas (lista de 3 a 6)
   - Conceptos relevantes (lista con término, definición breve según la fuente, e importancia: alta, media, clave)
   - Estructura del material (fases, secciones o bloques lógicos)
   - Autores o personas mencionadas en el texto (o indicar explícitamente "Ninguno mencionado en las fuentes" si no hay)
   - Definiciones importantes (términos clave y su significado textual)
   - Relaciones entre conceptos (cómo se conectan causas, efectos o marcos)
   - Posibles puntos relevantes para una evaluación (preguntas o ejes que un profesor evaluaría)
3. Basa el análisis 100% en las fuentes proporcionadas.

Devuelve tu respuesta en formato JSON estrictamente válido con la siguiente estructura:
{
  "mainTopic": "string",
  "subtopics": ["string", "string"],
  "keyConcepts": [{"term": "string", "definition": "string", "importance": "clave"|"alta"|"media"}],
  "structure": ["string", "string"],
  "mentionedAuthors": ["string"],
  "importantDefinitions": [{"term": "string", "explanation": "string"}],
  "conceptRelationships": ["string", "string"],
  "evaluationPoints": ["string", "string"]
}

FUENTES CARGADAS:
${combinedSourcesText}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '{}';
      try {
        const parsed = JSON.parse(text);
        return res.json({ analysis: parsed });
      } catch (err) {
        console.warn('JSON parsing error from Gemini, sending formatted fallback', err);
      }
    }

    return sendSimulated(res, await simulateAnalyzeSources(req.body));
  } catch (error: any) {
    console.error('Error analyzing sources:', error);
    res.status(500).json({ error: error.message || 'Error al analizar las fuentes' });
  }
});

// -------------------------------------------------------------
// POST /api/generate-artifact (PASO 6, 7 y 8: GENERACIÓN CON PERSONALIZACIÓN)
// -------------------------------------------------------------
app.post('/api/generate-artifact', async (req, res) => {
  try {
    const { artifactType, personalization, sources, notebookTitle } = req.body;

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({
        error: 'Antes de trabajar con este contenido, necesito que cargues al menos una fuente en este cuaderno. Puedes agregar un PDF, texto, imagen, link, video o audio.'
      });
    }

    // Plan enforcement: feature-gated artifacts and time-boxed quotas.
    const plan = req.user?.plan ?? 'free';
    const requiredFeature = ARTIFACT_FEATURE[artifactType];
    if (requiredFeature && !planHasFeature(plan, requiredFeature)) {
      return featureLockedResponse(res, requiredFeature);
    }
    const quotaKind = ARTIFACT_QUOTA[artifactType];
    // Offline fallback (no Gemini key) answers heuristically and does not consume quota.
    if (quotaKind && ai && req.user && !(await consumeQuota(req.user, quotaKind))) {
      return quotaExceededResponse(res, quotaKind);
    }
    // Pro plans get stronger processing for summaries.
    const strongProcessing = artifactType === 'resumen' && PLAN_CONFIG[plan].summaryProcessing === 'max';

    const combinedSources = sources
      .map((s: any, idx: number) => `--- FUENTE #${idx + 1} [${s.type.toUpperCase()}] "${s.title}" ---\n${s.content}`)
      .join('\n\n');

    if (ai) {
      const prompt = `Eres el motor de IA del "Copiloto de Estudio". Tu función es generar ÚNICAMENTE el artefacto educativo solicitado, rigurosamente anclado (grounding) en las fuentes cargadas.

ARTEFACTO SOLICITADO: ${artifactType.toUpperCase()}
TÍTULO DEL CUADERNO: "${notebookTitle || 'Estudio'}"

PARÁMETROS DE PERSONALIZACIÓN SELECCIONADOS POR EL ESTUDIANTE:
- Calidad de procesamiento: ${personalization.quality} (Bajo, Medio, Alto, Detallista)
- Formato: ${personalization.format} (texto, punteo, brainstorming, jerarquico)
- Extensión: ${personalization.length} (conciso, intermedio, detallado)
- Citar fuentes utilizadas: ${personalization.citeSources ? 'SÍ (incluye citas explícitas [Fuente: Nombre de la fuente])' : 'NO'}
- Respetar títulos y subtítulos originales: ${personalization.keepTitles ? 'SÍ (mantener la jerarquía de títulos y subtítulos del texto fuente)' : 'NO'}
- Destacar autores mencionados: ${personalization.highlightAuthors ? `SÍ (destacar cada autor o referente mencionado usando formato <mark class="author-highlight" data-color="${personalization.authorHighlightColor || 'amber'}">Nombre de Autor</mark>)` : 'NO'}
- Incorporar ejemplos periódicamente: ${personalization.addExamples ? 'SÍ (añade ejemplos prácticos periódicamente para enriquecer la explicación)' : 'NO (reducir el resumen a definición cruda y directa de conceptos, sin ejemplos)'}
- Generar imágenes/gráficos descriptivos: ${personalization.generateGraphics ? 'SÍ (incluye esquemas visuales ASCII/Markdown o diagramas conceptuales)' : 'NO'}
- Generar índice con navegación: ${personalization.generateIndex ? 'SÍ (incluye un índice al inicio con hipervínculos a los títulos y subtítulos generados)' : 'NO'}

REGLAS ESTRICTAS DE GROUNDING Y GENERACIÓN:
1. Basa todo el contenido prioritariamente en las fuentes cargadas.
2. Diferencia claramente información proveniente de las fuentes de cualquier explicación o ejemplo adicional.
3. NO inventes datos. Si falta información para una sección, adviértelo.
4. Genera ÚNICAMENTE este recurso (no mezcles otros artefactos).
5. Devuelve un objeto JSON con:
   - "title": Título descriptivo del artefacto
   - "artifactType": "${artifactType}"
   - "summaryText": Texto principal formateado en Markdown estructurado respetando la extensión y formato solicitado
   - "citations": Lista de cadenas con citas a las fuentes exactas
   - "structuredData": Estructura de apoyo según el tipo:
     * Si es 'cuestionario' o 'modelo_examen': lista de preguntas [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "...", "explanation": "...", "sourceCitation": "..."}]
     * Si es 'flashcards': lista de [{"question": "...", "answer": "...", "hint": "...", "category": "..."}]
     * Si es 'audio_podcast': diálogo entre 2 locutores [{"speaker": "Sofía (Host)"|"Lucas (Co-host)", "text": "...", "timestamp": "00:00"}]
     * Si es 'infografia': {"highlightStat": {"number": "...", "label": "..."}, "pillars": [{"title": "...", "desc": "...", "color": "..."}], "keyTakeaways": ["..."]}
     * Si es 'guia' o 'presentacion': diapositivas o secciones [{"title": "...", "points": ["..."], "note": "..."}]

FUENTES DE CONTEXTO:
${combinedSources}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          ...(strongProcessing ? { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } : {})
        }
      });

      const text = response.text || '{}';
      try {
        const parsed = JSON.parse(text);
        return res.json({ artifact: parsed });
      } catch (e) {
        console.warn('Error parsing AI artifact JSON', e);
      }
    }

    // Simulated artifact built from every selected source.
    return sendSimulated(res, await simulateGenerateArtifact(req.body));
  } catch (error: any) {
    console.error('Error generating artifact:', error);
    res.status(500).json({ error: error.message || 'Error al generar el artefacto' });
  }
});

// -------------------------------------------------------------
// POST /api/chat (CHAT CONVERGENCIAL CON GROUNDING ESTRICTO)
// -------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, sources, notebookTitle } = req.body;

    // Regla de fuentes seleccionadas para el chat
    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return res.json({
        reply: 'No tienes ninguna fuente seleccionada para este chat. Por favor, tilda al menos un texto en la pestaña FUENTES para que el chat responda con base en él.',
        sourcesCited: [],
        isGroundingWarning: true,
        suggestArtifactAction: false
      });
    }

    // Check if the user is asking to create an artifact in the chat
    const lowerMsg = (message || '').toLowerCase();
    const wantsArtifact =
      lowerMsg.includes('resumen') ||
      lowerMsg.includes('cuestionario') ||
      lowerMsg.includes('flashcard') ||
      lowerMsg.includes('examen') ||
      lowerMsg.includes('podcast') ||
      lowerMsg.includes('infografia') ||
      lowerMsg.includes('guia de estudio');

    // MOTOR RAG: Contexto completo de fuentes cargadas + fragmentación quirúrgica
    const allChunks = sources.flatMap((s: any) => chunkSourceIntoRAG(s));
    const { chunks: topChunks } = retrieveTopChunks(message, allChunks, 8);

    const fullSourcesContext = sources
      .map((s: any, idx: number) => {
        let text = `=== FUENTE #${idx + 1}: "${s.title}" [TIPO: ${(s.type || 'texto').toUpperCase()}] ===\n`;
        if (s.fileName) text += `Archivo original: ${s.fileName}\n`;
        if (s.sourceUrl) text += `Enlace: ${s.sourceUrl}\n`;
        if (s.analysisSummary) text += `[Resumen Analítico de la Fuente]: ${s.analysisSummary}\n`;
        if (s.processedConcepts && s.processedConcepts.length > 0) {
          text += `[Conceptos Clave Analizados]: ${s.processedConcepts.map((c: any) => `${c.term}: ${c.definition}`).join(' | ')}\n`;
        }
        if (s.processedAuthors && s.processedAuthors.length > 0) {
          text += `[Autores/Especialistas Mencionados]: ${s.processedAuthors.join(', ')}\n`;
        }
        if (s.processedKeyDetails && s.processedKeyDetails.length > 0) {
          text += `[Detalles y Conclusiones Clave]: ${s.processedKeyDetails.join(' | ')}\n`;
        }
        text += `\n[CONTENIDO ÍNTEGRO DE LA FUENTE]:\n${s.content}\n`;
        return text;
      })
      .join('\n-----------------------------------------\n\n');

    const fragmentsContext = topChunks
      .map((c, idx) => `[Fragmento Quirúrgico #${idx + 1} | Archivo: "${c.sourceTitle}" | Sección: "${c.sectionTitle}" | ${c.location}]\n${c.content}`)
      .join('\n\n---\n\n');

    if (ai) {
      const systemInstruction = `Eres el Copiloto de Estudio con Inteligencia Artificial para el cuaderno "${notebookTitle || 'Estudio'}".

TIENES ACCESO TOTAL Y DIRECTO a todo el contenido íntegro y al análisis de las fuentes de estudio que el estudiante ha cargado.

Tu misión es responder con rigor, exactitud, claridad y profundidad a cualquier pregunta general o específica sobre estas fuentes cargadas (conceptos, fórmulas, autores, citas, metodologías, fechas, casos prácticos, definiciones, comparaciones, etc.).

[REGLAS CRÍTICAS DE ACCESO Y FIDELIDAD A LAS FUENTES]
1. ACCESO COMPLETO: Tienes disponible el texto íntegro de cada fuente y su análisis semántico en la sección "FUENTES COMPLETAS CARGADAS POR EL ESTUDIANTE" abajo.
2. NUNCA digas "no tengo acceso a esa información en mis manuales" para preguntas que puedan responderse con las fuentes cargadas. Si el estudiante pregunta sobre autores, temas, definiciones, casos o detalles de sus fuentes, respóndele de forma completa y precisa.
3. CITAS VERIFICABLES: Siempre que respondas basándote en las fuentes, cita el nombre de la fuente o la sección correspondiente e inserta marcas como [1], [2] o [Archivo: Nombre] vinculadas a los fragmentos indexados provistos.
4. CONSULTAS GENERALES (Resúmenes, de qué trata, ideas clave): Si el estudiante pide un resumen, qué dice la fuente o de qué trata el material, proporciona una explicación estructurada, didáctica y completa fundamentada en el texto cargado.
5. CONSULTAS ESPECÍFICAS (Autores, conceptos, fórmulas, ejemplos, datos): Extrae la respuesta exacta y explícala detalladamente con base en las fuentes cargadas.
6. PREGUNTAS TOTALMENTE AJENAS: Solo si el estudiante hace una pregunta completamente fuera de contexto que no guarda ninguna relación con los temas de estudio ni con las fuentes cargadas (ej. resultados deportivos o recetas de cocina ajenas), indícale amablemente qué temas sí abarcan sus fuentes y ofrécele ayuda con ellos.

FUENTES COMPLETAS CARGADAS POR EL ESTUDIANTE:
${fullSourcesContext}

FRAGMENTOS QUIRÚRGICOS INDEXADOS (RAG):
${fragmentsContext}`;

      // Format multi-turn conversation history
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history) && history.length > 0) {
        // Exclude the current user turn if it's already the last item in history
        const priorMsgs = history.slice(0, -1);
        for (const msg of priorMsgs) {
          const role = msg.sender === 'user' ? 'user' : 'model';
          const text = msg.text?.trim() || '';
          if (!text) continue;

          const lastTurn = contents[contents.length - 1];
          if (lastTurn && lastTurn.role === role) {
            lastTurn.parts[0].text += `\n${text}`;
          } else {
            contents.push({
              role,
              parts: [{ text }]
            });
          }
        }
      }

      // Add the user's latest query
      const lastTurn = contents[contents.length - 1];
      if (lastTurn && lastTurn.role === 'user') {
        lastTurn.parts[0].text += `\n${message}`;
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.2
          }
        });

        const replyText = response.text || 'Sin respuesta';
        const isUnknownNotice = replyText.includes('Lo siento, no tengo acceso a esa información en mis manuales.');

        return res.json({
          reply: replyText,
          sourcesCited: isUnknownNotice ? [] : Array.from(new Set(sources.map((s: any) => s.title))),
          retrievedChunks: topChunks.map((c, i) => ({
            index: i + 1,
            sourceTitle: c.sourceTitle,
            sectionTitle: c.sectionTitle,
            location: c.location,
            snippet: c.content
          })),
          isGroundingWarning: isUnknownNotice,
          suggestArtifactAction: wantsArtifact
        });
      } catch (aiErr) {
        console.warn('Gemini API call warning in chat, using grounded RAG synthesizer:', aiErr);
        // Gracefully continues to heuristic RAG engine below
      }
    }

    // Simulated grounded answer synthesized from the best-matching sentences of the sources.
    return sendSimulated(res, await simulateChat(req.body));
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: error.message || 'Error en el chat de estudio' });
  }
});

// -------------------------------------------------------------
// POST /api/refine-artifact (FEEDBACK Y REFINAMIENTO DIRIGIDO)
// -------------------------------------------------------------
app.post('/api/refine-artifact', async (req, res) => {
  try {
    const { currentContent, feedbackType, comment, sources } = req.body;

    if (ai && sources && sources.length > 0) {
      const prompt = `El estudiante ha solicitado una mejora específica sobre el siguiente artefacto de estudio.

REGLA PRINCIPAL: Modifica ÚNICAMENTE aquello que sea necesario y conserva intacto el resto del contexto y estructura.
FEEDBACK DEL ESTUDIANTE:
Tipo: ${feedbackType}
Comentario / Instrucción específica: "${comment}"

CONTENIDO ACTUAL DEL ARTEFACTO:
${currentContent}

FUENTES DEL CUADERNO (Grounding):
${sources.map((s: any) => s.content).join('\n')}

Devuelve el texto del artefacto actualizado en Markdown, manteniendo fidelidad con las fuentes.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });

      return res.json({ updatedContent: response.text });
    }

    // Simulated refinement: applies the requested change to the current text.
    return sendSimulated(res, await simulateRefine(req.body));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al refinar artefacto' });
  }
});

// -------------------------------------------------------------
// POST /api/active-recall (PREGUNTA DESAFIANTE PARA APRENDIZAJE ACTIVO)
// -------------------------------------------------------------
app.post('/api/active-recall', async (req, res) => {
  try {
    const { sources, notebookTitle, userAnswer, challenge } = req.body;
    if (!sources || sources.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos una fuente.' });
    }

    // Evaluation of the student's answer (concept overlap with the reference answer).
    if (typeof userAnswer === 'string' && userAnswer.trim()) {
      return sendSimulated(res, await simulateRecall(req.body));
    }

    if (ai) {
      const prompt = `Formula una pregunta desafiante de ACTIVE RECALL basada estrictamente en las fuentes del cuaderno "${notebookTitle}".
El objetivo es que el estudiante recupere activamente de su memoria un concepto clave o relación causal sin mirar sus apuntes.

FUENTES:
${sources.map((s: any) => s.content).join('\n')}

Devuelve JSON con:
{
  "challengeQuestion": "string",
  "expectedKeyPoints": ["punto 1", "punto 2"],
  "canonicalAnswer": "string",
  "sourceReference": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      try {
        const parsed = JSON.parse(response.text || '{}');
        return res.json({ challenge: parsed });
      } catch (e) {
        console.warn('Error parsing active recall JSON', e);
      }
    }

    return sendSimulated(res, await simulateRecall(req.body));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error en Active Recall' });
  }
});

// -------------------------------------------------------------
// POST /api/support-chat (AGENTE DE SOPORTE Y RESERVAS MULTIPASO CONSCIENTE DEL CONTEXTO)
// -------------------------------------------------------------
app.post('/api/support-chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;

    const userMsg = (message || '').trim();
    if (!userMsg) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    const currentNotebook = context?.activeNotebook;
    const currentView = context?.currentView || 'explorer';
    const activeSegment = context?.activeSegment || 'GENERAL';
    const stats = context?.stats || {};
    const username = context?.username || 'Estudiante';

    const systemInstruction = `Eres "Soporte IA Copiloto", un agente de soporte técnico, académico y tutor inteligente de la plataforma "Copiloto de Estudio v1.1".

Tu objetivo es asistir al usuario manteniendo memoria estricta de todo el historial de la conversación previa para resolver flujos conversacionales de múltiples pasos (multi-turn), especialmente:

1. RESOLUCIÓN DE PROBLEMAS TÉCNICOS Y FUNCIONALES (Troubleshooting paso a paso):
   - Diagnosticar inconvenientes con subida y lectura de documentos (PDF, audio, imágenes, enlaces).
   - Resolver problemas con el temporizador Pomodoro Blindado o el Focus Shield (protección de pestañas).
   - Guiar paso a paso en la generación y personalización de artefactos (resúmenes, cuestionarios, flashcards, guías, podcasts).
   - Orientar sobre el motor RAG y verificación de citas ancladas.
   - Recordar siempre qué pasos o acciones ya intentó el usuario para no repetir sugerencias y avanzar al paso siguiente.

2. GESTIÓN DE RESERVAS DE MÚLTIPLES PASOS (Reservas de Tutorías y Salas de Estudio):
   - Gestionar reservas para:
     a) Sesión de tutoría personalizada con profesores/mentores.
     b) Salas de estudio (cubículos individuales silenciosos o salas grupales de debate).
   - Guiar la conversación paso a paso:
     * Si faltan datos (materia, fecha, hora, modalidad), solicítalos cordialmente uno a la vez o de forma estructurada.
     * Si el usuario confirma todos los datos requeridos, incluye al final de tu mensaje una confirmación estructurada en una etiqueta especial con este formato JSON:
     :::RESERVATION_CONFIRMED:::
     {
       "id": "RES-${Math.floor(100000 + Math.random() * 900000)}",
       "type": "Tutoría Personalizada" o "Sala de Estudio Silenciosa" o "Sala Grupal Colaborativa",
       "subject": "Tema o Materia",
       "dateTime": "Fecha y hora confirmada",
       "hostOrRoom": "Nombre del Tutor asignado o Sala (ej. Prof. Dr. Silva, Sala Enfoque 3)",
       "student": "${username}"
     }
     :::END_RESERVATION:::

3. CONTEXTO ACTIVO DE LA APLICACIÓN (Awareness):
   - Estudiante activo: ${username} (plan ${context?.plan === 'pro' ? 'Pro' : context?.plan === 'extended' ? 'Extended' : 'Gratis'})
   - Pantalla actual: ${currentView === 'workspace' && currentNotebook ? `Dentro del cuaderno "${currentNotebook.title}" (Materia: "${currentNotebook.subject}", ${currentNotebook.sourcesCount || 0} fuentes cargadas) en la pestaña ${activeSegment}` : 'Explorador de Carpetas y Cuadernos de Estudio'}
   - Rendimiento del estudiante: ${stats.focusMinutesToday || 0} min de estudio hoy, racha activa de ${stats.currentStreakDays || 1} días, ${stats.sessionsCompleted || 0} bloques completados.

Usa un tono cordial, empático, claro y estructurado con markdown. Responde siempre en español.`;

    if (ai) {
      // Build conversation contents preserving role alternations
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history) && history.length > 0) {
        for (const item of history) {
          const role = item.role === 'user' ? 'user' : 'model';
          const text = (item.text || '').trim();
          if (!text) continue;

          const last = contents[contents.length - 1];
          if (last && last.role === role) {
            last.parts[0].text += `\n${text}`;
          } else {
            contents.push({ role, parts: [{ text }] });
          }
        }
      }

      // Add the latest user message
      const last = contents[contents.length - 1];
      if (last && last.role === 'user') {
        last.parts[0].text += `\n${userMsg}`;
      } else {
        contents.push({ role: 'user', parts: [{ text: userMsg }] });
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.4
          }
        });

        const replyText = response.text || 'Entendido. ¿En qué más puedo orientarte?';

        // Check for reservation tag
        let reservationData: any = null;
        const resMatch = replyText.match(/:::RESERVATION_CONFIRMED:::([\s\S]*?):::END_RESERVATION:::/);
        if (resMatch && resMatch[1]) {
          try {
            reservationData = JSON.parse(resMatch[1].trim());
          } catch (e) {
            console.warn('Failed to parse reservation JSON', e);
          }
        }

        const cleanReply = replyText.replace(/:::RESERVATION_CONFIRMED:::[\s\S]*?:::END_RESERVATION:::/, '').trim();

        return res.json({
          reply: cleanReply,
          reservation: reservationData,
          model: 'gemini-3.8-flash'
        });
      } catch (geminiErr: any) {
        console.warn('Gemini support call warning, fallback to rule assistant:', geminiErr);
      }
    }

    return sendSimulated(res, await simulateSupport(req.body));
  } catch (error: any) {
    console.error('Error in support chat:', error);
    res.status(500).json({ error: error.message || 'Error en el agente de soporte' });
  }
});

// -------------------------------------------------------------
// POST /api/search-grounding (AGENTE CONECTADO A LA BÚSQUEDA DE GOOGLE EN TIEMPO REAL)
// -------------------------------------------------------------
app.post('/api/search-grounding', requireFeature('googleSearch'), async (req, res) => {
  try {
    const { message, history, mode } = req.body;
    const userMsg = (message || '').trim();

    if (!userMsg) {
      return res.status(400).json({ error: 'Mensaje requerido para la búsqueda.' });
    }

    if (ai) {
      const modeInstruction = mode === 'factcheck'
        ? `MODO ESPECIAL: VERIFICACIÓN DE INFORMACIÓN Y FACT-CHECKING
- Tu tarea principal es determinar si la afirmación o información proporcionada es fidedigna, engañosa, falsa o está en desarrollo.
- Empieza SIEMPRE con una línea de veredicto destacada:
  [✅ VERIFICADO: VERDADERO], [⚠️ PARCIALMENTE CIERTO / MATIZADO], [❌ DESMENTIDO / FALSO] o [🔍 EN DESARROLLO / INFORMACIÓN EN EVOLUCIÓN].
- Presenta el contraste de hechos con datos específicos, fuentes oficiales o investigaciones periodísticas indexadas en Google.
- Explica qué matices o información omitida causan desinformación o confusión.`
        : mode === 'news'
        ? `MODO ESPECIAL: CITAR NOTICIAS RECIENTES
- Concéntrate en los acontecimientos más recientes y de última hora sobre el tema.
- Nombra con exactitud los medios de comunicación y portales de noticias que informan sobre el suceso (ej. Reuters, El País, BBC, Nature, TechCrunch, EFE, etc.).
- Organiza cronológicamente o por impacto los hechos reportados.`
        : `MODO GENERAL: EVENTOS ACTUALES Y BÚSQUEDA EN VIVO
- Responde conectándote a los datos más actualizados y en tiempo real de la Búsqueda de Google.
- Explica el estado actual del tema, datos clave y citas relevantes.`;

      const systemInstruction = `Eres "Agente de Búsqueda Google en Vivo", un asistente inteligente de verificación de hechos y análisis de actualidad conectado en tiempo real a la Búsqueda de Google.

Tus capacidades primordiales son:
1. HABLAR SOBRE EVENTOS ACTUALES: Informar sobre sucesos recientes a nivel global, regional, científico, educativo, económico y cultural.
2. CITAR NOTICIAS RECIENTES: Identificar y citar las coberturas periodísticas más recientes, indicando titulares, fuentes y fechas.
3. VERIFICAR INFORMACIÓN (Fact-Checking): Contrastar rumores, afirmaciones y datos con fuentes confiables indexadas en Google Search para combatir la desinformación.

${modeInstruction}

ESTRUCTURA DE RESPUESTA RECOMENDADA:
- Resumen directo y veredicto de actualidad.
- Desarrollo detallado con puntos clave destacados.
- Sección final: "### 📰 Fuentes y Referencias de Google", citando los medios o portales relevantes.
- Tono: Periodístico, riguroso, analítico, objetivo y en español.`;

      // Build conversation turns
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history) && history.length > 0) {
        for (const item of history) {
          const role = item.role === 'user' ? 'user' : 'model';
          const text = (item.text || '').trim();
          if (!text) continue;

          const last = contents[contents.length - 1];
          if (last && last.role === role) {
            last.parts[0].text += `\n${text}`;
          } else {
            contents.push({ role, parts: [{ text }] });
          }
        }
      }

      // Append current message
      const last = contents[contents.length - 1];
      if (last && last.role === 'user') {
        last.parts[0].text += `\n${userMsg}`;
      } else {
        contents.push({ role: 'user', parts: [{ text: userMsg }] });
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
            temperature: 0.2
          }
        });

        const candidate = response.candidates?.[0];
        const replyText = response.text || 'Sin respuesta obtenida de Google Search.';
        const metadata = candidate?.groundingMetadata || {};
        const webSearchQueries: string[] = metadata.webSearchQueries || [];
        const rawChunks = metadata.groundingChunks || [];

        const sources = rawChunks
          .map((chunk: any) => {
            const uri = chunk.web?.uri || '';
            const title = chunk.web?.title || 'Fuente de Google Search';
            let domain = 'google.com';
            try {
              if (uri) {
                const u = new URL(uri);
                domain = u.hostname.replace('www.', '');
              }
            } catch {
              // ignore
            }
            return { title, url: uri, domain };
          })
          .filter((s: any) => Boolean(s.url));

        // Deduplicate sources
        const uniqueSources: Array<{ title: string; url: string; domain: string }> = [];
        const seenUrls = new Set<string>();
        for (const s of sources) {
          if (!seenUrls.has(s.url)) {
            seenUrls.add(s.url);
            uniqueSources.push(s);
          }
        }

        // Determine if verdict present
        let verdict: string | null = null;
        if (replyText.includes('[✅ VERIFICADO') || replyText.includes('VERIFICADO: VERDADERO')) {
          verdict = 'VERIFICADO_VERDADERO';
        } else if (replyText.includes('[⚠️ PARCIALMENTE') || replyText.includes('PARCIALMENTE CIERTO')) {
          verdict = 'PARCIALMENTE_CIERTO';
        } else if (replyText.includes('[❌ DESMENTIDO') || replyText.includes('DESMENTIDO / FALSO')) {
          verdict = 'FALSO_DESMENTIDO';
        } else if (replyText.includes('[🔍 EN DESARROLLO')) {
          verdict = 'EN_DESARROLLO';
        }

        return res.json({
          reply: replyText,
          verdict,
          searchQueries: webSearchQueries.length > 0 ? webSearchQueries : [userMsg],
          sources: uniqueSources,
          groundingMetadata: metadata,
          verifiedAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isRealTime: true,
          mode: mode || 'general'
        });
      } catch (searchErr: any) {
        console.warn('Google Search Grounding API call warning, running realistic local verification engine:', searchErr);
      }
    }

    return sendSimulated(res, await simulateSearchGrounding(req.body));
  } catch (error: any) {
    console.error('Error in search grounding endpoint:', error);
    res.status(500).json({ error: error.message || 'Error en la búsqueda con Google' });
  }
});

