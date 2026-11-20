import {
  buildCorpus,
  hashString,
  lowerFirst,
  norm,
  queryStems,
  queryWords,
  shortTerm,
  similarity,
  splitSentences,
  stem,
  tokenize,
  topTerms,
  trimSentence,
  finish,
  type SourceLike,
} from './text.js';

export interface ChunkLike {
  sourceTitle: string;
  sectionTitle: string;
  location: string;
  content: string;
}

export interface ChatSynthesis<C extends ChunkLike> {
  reply: string;
  /** Chunks cited in the reply, in citation order ([1] = chunks[0]). */
  chunks: C[];
  sourcesCited: string[];
  isGroundingWarning: boolean;
}

interface Candidate {
  text: string;
  chunkIndex: number;
  position: number;
  score: number;
}

const GREETING = /^\s*(hola|buenas|buen[oa]s (d[ií]as|tardes|noches)|hey|gracias|muchas gracias|ok|vale|perfecto)\b[\s!.,¡]*$/i;
const OVERVIEW =
  /\b(resum|de qu[eé] (trata|habla)|ideas? (principal|clave|central)|puntos? clave|conceptos? (clave|central|principal)|qu[eé] (dice|explica|cubre)|panorama|visi[oó]n general|importante)/i;

function pick<T>(items: T[], seed: string): T {
  return items[hashString(seed) % items.length];
}

function bullet(sentence: string, n: number): string {
  let text = trimSentence(sentence, 210);
  // "Term: definition" lines read better with the term in bold.
  const m = /^([^:]{2,45}):\s+(\S.*)$/.exec(text);
  if (m && m[1].split(/\s+/).length <= 5) text = `**${m[1].trim()}**: ${lowerFirst(m[2])}`;
  else text = text.charAt(0).toUpperCase() + text.slice(1);
  return `- ${finish(text).replace(/…$/, '…')} [${n}]`;
}

function introFor(message: string, topic: string, overview: boolean, mainTopic: string): string {
  const m = norm(message);
  if (overview) return mainTopic ? `Esto es lo más importante que cubre **${mainTopic}**:` : 'Esto es lo más importante que cubren tus fuentes:';
  if (/^\s*(que|cual) (es|son|significa)|define|definicion|significa/.test(m)) {
    return pick(
      [`Según tus fuentes, **${topic}** se entiende así:`, `Esto es lo que tus fuentes dicen sobre **${topic}**:`],
      message,
    );
  }
  if (/\b(como|pasos|proceso|procedimiento)\b/.test(m)) {
    return pick([`Así se explica **${topic}** en tus fuentes:`, `Sobre cómo funciona **${topic}**, tus fuentes destacan lo siguiente:`], message);
  }
  if (/\b(por que|para que|razon|motivo|importancia)\b/.test(m)) {
    return `Estas son las ideas que tus fuentes dan sobre **${topic}** y su razón de ser:`;
  }
  if (/\b(diferencia|comparar|compara|versus|vs)\b/.test(m)) {
    return `Para comparar lo que preguntas, esto es lo que aparece sobre **${topic}** en tus fuentes:`;
  }
  return pick(
    [`Sobre **${topic}**, esto es lo que encontré en tus fuentes:`, `Con lo que tienes cargado, **${topic}** se resume así:`],
    message,
  );
}

/**
 * Heuristic "RAG answer": intro that reframes the question, 2-4 bullets built from the best-scoring
 * sentences of the chunks, a follow-up suggestion and [n] citations matching `chunks`.
 */
export function synthesizeChatReply<C extends ChunkLike>(args: {
  message: string;
  history?: Array<{sender?: string; text?: string}>;
  allChunks: C[];
  sources: SourceLike[];
  wantsArtifact?: boolean;
}): ChatSynthesis<C> {
  const {message, history, allChunks, sources, wantsArtifact} = args;
  const corpus = buildCorpus(sources);
  const mainTopic = corpus.sourceTitles.length === 1 ? corpus.title.replace(/\.[^/.]+$/, '') : '';
  const overviewTerms = topTerms(corpus, 4).map((t) => t.text);

  if (GREETING.test(message)) {
    const focus = overviewTerms.slice(0, 3).map((t) => `**${t}**`).join(', ');
    return {
      reply: `¡Hola! Estoy lista para ayudarte con tus fuentes${focus ? `, que tratan sobre ${focus}` : ''}. Puedes preguntarme por un concepto, pedirme un resumen o que te explique una idea paso a paso.`,
      chunks: [],
      sourcesCited: [],
      isGroundingWarning: false,
    };
  }

  // Query stems; a very short follow-up ("¿y eso cómo se aplica?") inherits the previous question.
  let stems = queryStems(message);
  let words = queryWords(message);
  let inherited = '';
  if (stems.length <= 1 && history && history.length > 1) {
    const previous = [...history.slice(0, -1)].reverse().find((h) => h.sender === 'user' && h.text);
    if (previous?.text) {
      stems = Array.from(new Set([...queryStems(previous.text), ...stems]));
      words = queryWords(previous.text);
      inherited = previous.text;
    }
  }
  const overview = OVERVIEW.test(message) || stems.length === 0;
  const mentionSource = `${message} ${inherited}`;
  const mentioned = corpus.pairs.filter((p) => norm(mentionSource).includes(norm(shortTerm(p.term)))).map((p) => shortTerm(p.term));

  // Score every sentence of every chunk.
  const candidates: Candidate[] = [];
  const msgNorm = norm(message);
  allChunks.forEach((chunk, chunkIndex) => {
    const sectionStems = new Set(tokenize(chunk.sectionTitle).map(stem));
    const titleStems = new Set(tokenize(chunk.sourceTitle).map(stem));
    const sentences = splitSentences(chunk.content);
    sentences.forEach((text, position) => {
      const sStems = new Set(tokenize(text).map(stem));
      let hits = 0;
      let bonus = 0;
      for (const q of stems) {
        if (sStems.has(q)) hits += 1;
        if (sectionStems.has(q)) bonus += 1.2;
        if (titleStems.has(q)) bonus += 0.5;
      }
      let score = hits * 3 + bonus;
      if (hits > 0 && msgNorm.length > 8 && norm(text).includes(msgNorm.replace(/[¿?¡!]/g, '').trim())) score += 6;
      if (hits > 0 && /\b(es|son|consiste|se define|permite|significa)\b/i.test(text)) score += 0.8;
      if (hits > 0 && position === 0) score += 0.5;
      if (text.length > 300) score *= 0.8;
      candidates.push({text, chunkIndex, position, score});
    });
  });

  let pool: Candidate[];
  if (overview) {
    // General score of the sentence in the corpus.
    const central = new Map(corpus.sentences.map((s) => [s.text, s.score]));
    pool = candidates
      .map((c) => ({...c, score: (central.get(c.text) ?? 0) + 0.01}))
      .filter((c) => c.score > 0.02)
      .sort((a, b) => b.score - a.score);
  } else {
    pool = candidates.filter((c) => c.score >= 3).sort((a, b) => b.score - a.score);
  }

  if (pool.length === 0) {
    const covered = overviewTerms.map((t) => `**${t}**`);
    const where = corpus.sourceTitles.slice(0, 2).map((t) => `«${t}»`).join(' y ');
    const cover = covered.length > 0 ? ` Lo que sí cubren ${where ? `(${where}) ` : ''}es: ${covered.join(', ')}.` : '';
    return {
      reply: `No encontré eso en tus fuentes.${cover}\n\nPuedes reformular la pregunta con alguno de esos temas, cargar una fuente que lo trate o buscarlo en la web.`,
      chunks: [],
      sourcesCited: [],
      isGroundingWarning: true,
    };
  }

  // Pick up to 4 sentences, avoiding near-duplicates and favouring different chunks.
  const maxBullets = overview ? 4 : 4;
  const picked: Candidate[] = [];
  const perChunk = new Map<number, number>();
  const ranked = pool.slice();
  while (picked.length < maxBullets && ranked.length > 0) {
    ranked.sort((a, b) => b.score * 0.65 ** (perChunk.get(b.chunkIndex) ?? 0) - a.score * 0.65 ** (perChunk.get(a.chunkIndex) ?? 0));
    const next = ranked.shift()!;
    if (picked.some((p) => similarity(p.text, next.text) > 0.6)) continue;
    if (!overview && picked.length >= 2 && next.score < pool[0].score * 0.3) break;
    picked.push(next);
    perChunk.set(next.chunkIndex, (perChunk.get(next.chunkIndex) ?? 0) + 1);
  }
  // A single hit is thin: add the sentence that follows it as context.
  if (picked.length === 1) {
    const only = picked[0];
    const following = candidates.find((c) => c.chunkIndex === only.chunkIndex && c.position === only.position + 1);
    if (following && similarity(following.text, only.text) <= 0.6) picked.push({...following, score: 0});
  }
  picked.sort((a, b) => a.chunkIndex - b.chunkIndex || a.position - b.position);

  const chunkOrder: number[] = [];
  for (const p of picked) if (!chunkOrder.includes(p.chunkIndex)) chunkOrder.push(p.chunkIndex);
  const chunks = chunkOrder.map((i) => allChunks[i]);
  const citeOf = (chunkIndex: number) => chunkOrder.indexOf(chunkIndex) + 1;

  const topic = (mentioned.length > 0 ? mentioned.slice(0, 2).join(' y ') : words.slice(0, 3).join(' ')) || overviewTerms[0] || mainTopic || 'tus fuentes';
  const intro = introFor(message, topic, overview, mainTopic);
  const bullets = picked.map((p) => bullet(p.text, citeOf(p.chunkIndex)));

  // Follow-up: a related key term that the answer did not mention.
  const answered = norm(picked.map((p) => p.text).join(' '));
  const spare = topTerms(corpus, 8).find((t) => !answered.includes(norm(t.text)) && !stems.includes(stem(t.text)));
  const closers: string[] = [];
  if (spare) {
    closers.push(`¿Quieres que profundice en **${spare.text}** o que lo conecte con lo que acabamos de ver?`);
    closers.push(`Si te sirve, puedo explicarte **${spare.text}** con un ejemplo.`);
  }
  closers.push('¿Armamos unas flashcards o un mini cuestionario para repasar esto?');
  closers.push('Si quieres, lo vemos paso a paso o lo comparo con otra parte de tus fuentes.');
  const closing = wantsArtifact
    ? 'Si quieres llevarte esto en formato de estudio, puedo convertirlo en un material desde la pestaña Materiales.'
    : pick(closers, message + 'closing');

  const sourcesCited = Array.from(new Set(chunks.map((c) => c.sourceTitle)));
  return {
    reply: `${intro}\n\n${bullets.join('\n')}\n\n${closing}`,
    chunks,
    sourcesCited,
    isGroundingWarning: false,
  };
}
