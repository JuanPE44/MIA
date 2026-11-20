import {
  buildCorpus,
  capitalize,
  isStopword,
  norm,
  shortTerm,
  shuffle,
  stem,
  tokenize,
  topTerms,
  trimSentence,
  finish,
  definitionBody,
  type SourceLike,
} from './text.js';

export interface RecallChallenge {
  challengeQuestion: string;
  expectedKeyPoints: string[];
  canonicalAnswer: string;
  sourceReference: string;
}

export interface RecallEvaluation {
  score: number;
  level: 'alto' | 'medio' | 'bajo';
  hitTerms: string[];
  missedTerms: string[];
  feedback: string;
}

/** Question + key points from a random key concept of the sources. */
export function generateRecallChallenge(sources: SourceLike[]): RecallChallenge {
  const corpus = buildCorpus(sources);
  const pool = corpus.pairs.length > 0 ? shuffle(corpus.pairs.slice(0, 8)) : [];
  const pair = pool[0];

  if (pair) {
    const term = shortTerm(pair.term);
    const related = corpus.sentences
      .filter((s) => s.section === pair.section && s.text !== pair.definition && s.stems.size > 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((s) => s.text);
    const questions = [
      `Explica con tus propias palabras qué es «${term}» y por qué importa según «${pair.source}».`,
      `Sin mirar tus apuntes: ¿qué dice «${pair.source}» sobre «${term}»? Intenta incluir las ideas principales.`,
      `¿Cómo le explicarías «${term}» a un compañero que no leyó «${pair.source}»?`,
    ];
    return {
      challengeQuestion: questions[Math.floor(Math.random() * questions.length)],
      expectedKeyPoints: Array.from(new Set([trimSentence(pair.definition, 130), ...related.map((r) => trimSentence(r, 130))])).slice(0, 3),
      canonicalAnswer: [pair.definition, related[0]].filter(Boolean).map((s) => `${finish(trimSentence(s, 220))}`).join(' '),
      sourceReference: `${pair.source} · ${pair.section}`,
    };
  }

  const terms = topTerms(corpus, 6);
  const term = terms.length > 0 ? terms[Math.floor(Math.random() * Math.min(terms.length, 4))] : undefined;
  const sentences = term
    ? corpus.sentences.filter((s) => s.stems.has(term.stem) || s.stems.has(stem(term.text))).sort((a, b) => b.score - a.score).slice(0, 3)
    : corpus.sentences.slice().sort((a, b) => b.score - a.score).slice(0, 3);
  const subject = term ? `«${shortTerm(term.text)}»` : `«${corpus.title}»`;
  return {
    challengeQuestion: `Explica con tus propias palabras qué dice «${corpus.title}» sobre ${subject} y por qué es relevante.`,
    expectedKeyPoints: Array.from(new Set(sentences.map((s) => trimSentence(s.text, 130)))),
    canonicalAnswer: sentences.map((s) => `${finish(trimSentence(s.text, 220))}`).join(' ') || 'Revisa tus fuentes para contrastar tu respuesta.',
    sourceReference: sentences[0] ? `${sentences[0].source} · ${sentences[0].section}` : corpus.title,
  };
}

function conceptStems(text: string, limit: number): Array<{display: string; stem: string}> {
  const counts = new Map<string, {display: string; n: number}>();
  for (const w of tokenize(text)) {
    if (isStopword(w) || norm(w).length < 4) continue;
    const k = stem(w);
    const e = counts.get(k) ?? {display: w.toLowerCase(), n: 0};
    e.n += 1;
    counts.set(k, e);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1].n - a[1].n || b[1].display.length - a[1].display.length)
    .slice(0, limit)
    .map(([k, e]) => ({display: e.display, stem: k}));
}

/** Scores the student's answer by concept overlap with the reference answer and key points. */
export function evaluateRecallAnswer(userAnswer: string, challenge: Partial<RecallChallenge>): RecallEvaluation {
  const reference = [challenge.canonicalAnswer ?? '', ...(challenge.expectedKeyPoints ?? [])].join(' ');
  const concepts = conceptStems(reference, 7);
  const answerStems = new Set(tokenize(userAnswer).map(stem));
  const hit = concepts.filter((c) => answerStems.has(c.stem));
  const missed = concepts.filter((c) => !answerStems.has(c.stem));
  const ratio = concepts.length > 0 ? hit.length / concepts.length : 0;
  const words = userAnswer.trim().split(/\s+/).filter(Boolean).length;
  // Very short answers cannot earn full marks even if they hit a keyword or two.
  const score = Math.round(Math.min(1, ratio) * (words < 8 ? 0.7 : 1) * 100);
  const level: RecallEvaluation['level'] = score >= 70 ? 'alto' : score >= 40 ? 'medio' : 'bajo';
  const hitTerms = hit.map((c) => c.display);
  const missedTerms = missed.map((c) => c.display);

  const fmt = (xs: string[]) => xs.slice(0, 4).map((x) => `«${x}»`).join(', ');
  let feedback: string;
  if (level === 'alto') {
    feedback = `¡Muy bien! Recuperaste ${fmt(hitTerms)}.${missedTerms.length ? ` Para dejarla redonda, suma ${fmt(missedTerms)}.` : ' Cubriste los puntos esenciales.'}`;
  } else if (level === 'medio') {
    feedback = `Vas por buen camino: mencionaste ${hitTerms.length ? fmt(hitTerms) : 'algunas ideas'}, pero faltó ${fmt(missedTerms)}. Vuelve a la fuente y reescribe tu respuesta incluyendo esos conceptos.`;
  } else {
    feedback = `Todavía no aparecen los conceptos centrales${missedTerms.length ? `, como ${fmt(missedTerms)}` : ''}. Repasa la fuente y vuelve a intentarlo con tus propias palabras.`;
  }
  return {score, level, hitTerms, missedTerms, feedback: capitalize(feedback)};
}
