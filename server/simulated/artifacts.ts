import {
  buildCorpus,
  capitalize,
  detectAuthors,
  exampleSentences,
  lowerFirst,
  norm,
  queryStems,
  sentencesAbout,
  shortTerm,
  shuffle,
  similarity,
  stem,
  tokenize,
  topTerms,
  trimSentence,
  finish,
  definitionBody,
  uniqueBy,
  type Corpus,
  type SourceLike,
} from './text.js';

export interface Personalization {
  quality?: 'bajo' | 'medio' | 'alto' | 'detallista';
  format?: 'texto' | 'punteo' | 'brainstorming' | 'jerarquico';
  length?: 'conciso' | 'intermedio' | 'detallado';
  citeSources?: boolean;
  keepTitles?: boolean;
  highlightAuthors?: boolean;
  authorHighlightColor?: string;
  addExamples?: boolean;
  generateGraphics?: boolean;
  generateIndex?: boolean;
}

export interface SimulatedArtifact {
  title: string;
  artifactType: string;
  summaryText: string;
  citations: string[];
  structuredData: unknown;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  sourceCitation: string;
}

const slug = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const baseName = (title: string): string => title.replace(/\.[^/.]+$/, '').trim() || title;
const clean = (s: string): string => s.replace(/\s*[.;:]+$/, '');
const sentence = (s: string, max = 200): string => `${finish(trimSentence(s, max))}`;

function mainTopic(corpus: Corpus, notebookTitle?: string): string {
  if (corpus.sourceTitles.length === 1) return baseName(corpus.title);
  if (notebookTitle?.trim()) return notebookTitle.trim();
  const [a, b] = topTerms(corpus, 2);
  return a && b ? `${capitalize(a.text)} y ${b.text}` : baseName(corpus.title);
}

// ---------------------------------------------------------------- quiz

function buildQuiz(corpus: Corpus, count = 5): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const usedCorrect = new Set<string>();
  const terms = topTerms(corpus, 14);
  const pairs = uniqueBy(corpus.pairs, (p) => p.term);
  const allDefs = pairs.map((p) => trimSentence(definitionBody(p.term, p.definition), 170));
  const topSentences = corpus.sentences
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((s) => trimSentence(s.text.replace(/^[^:]{2,45}:\s+(?=\S)/, ''), 170));

  const finishQuestion = (q: Omit<QuizQuestion, 'options' | 'correctAnswer'> & {correct: string; distractors: string[]}): void => {
    const distractors = uniqueBy(
      q.distractors.filter((d) => d && norm(d) !== norm(q.correct) && similarity(d, q.correct) < 0.7),
      (d) => d,
    ).slice(0, 3);
    if (distractors.length < 2) return;
    questions.push({
      question: q.question,
      options: shuffle([q.correct, ...distractors]),
      correctAnswer: q.correct,
      explanation: q.explanation,
      sourceCitation: q.sourceCitation,
    });
    usedCorrect.add(norm(q.correct));
  };

  const defQuestions = pairs.map((p) => () => {
    const correct = trimSentence(definitionBody(p.term, p.definition), 170);
    if (usedCorrect.has(norm(correct))) return;
    const mentions = (d: string) => norm(d).includes(norm(shortTerm(p.term)));
    const others = shuffle([...allDefs, ...topSentences].filter((d) => norm(d) !== norm(correct) && !mentions(d)));
    finishQuestion({
      question: `¿Cuál de estas opciones describe mejor «${shortTerm(p.term)}»?`,
      correct,
      distractors: others,
      explanation: p.section === p.source ? `Así se define en «${p.source}».` : `Así se define en «${p.source}», en la sección «${p.section}».`,
      sourceCitation: `Fuente: ${p.source}`,
    });
  });

  const clozeQuestions = terms.map((t) => () => {
    const word = shortTerm(t.text);
    if (word.split(' ').length > 1 || word.length < 4 || usedCorrect.has(norm(word))) return;
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\p{L}\\p{N}])`, 'iu');
    const s = corpus.sentences
      .filter((x) => re.test(x.text) && x.text.length >= 40 && x.text.length <= 230)
      .sort((a, b) => b.score - a.score)[0];
    if (!s) return;
    const m = re.exec(s.text)!;
    const blanked = s.text.replace(re, `${m[1]}_____`);
    const surface = m[2];
    finishQuestion({
      question: `Completa la idea de «${s.source}»: «${clean(blanked)}».`,
      correct: surface,
      distractors: shuffle(terms.map((x) => shortTerm(x.text)).filter((x) => norm(x) !== norm(word) && x.length >= 5 && x.split(' ').length === 1 && stem(x) !== stem(word))).map((x) => (/^[A-ZÁÉÍÓÚÑ]/.test(surface) ? capitalize(x) : /^[A-ZÁÉÍÓÚÑ]{2,}$/.test(x) ? x : x.toLowerCase())),
      explanation: s.section === s.source ? `El término que completa la idea es «${surface}» (${s.source}).` : `El término que completa la idea es «${surface}» (${s.source}, sección «${s.section}»).`,
      sourceCitation: `Fuente: ${s.source}`,
    });
  });

  // Alternate kinds so the quiz is not monotone.
  const queue: Array<() => void> = [];
  const maxLen = Math.max(defQuestions.length, clozeQuestions.length);
  for (let i = 0; i < maxLen; i++) {
    if (defQuestions[i]) queue.push(defQuestions[i]);
    if (clozeQuestions[i]) queue.push(clozeQuestions[i]);
  }
  for (const make of queue) {
    if (questions.length >= count) break;
    make();
  }
  return questions;
}

// ---------------------------------------------------------------- flashcards

function buildFlashcards(corpus: Corpus): Array<{question: string; answer: string; hint: string; category: string}> {
  const cards: Array<{question: string; answer: string; hint: string; category: string}> = [];
  const used = new Set<string>();
  const add = (term: string, answer: string, section: string, source: string) => {
    const k = norm(shortTerm(term));
    const a = norm(answer);
    if (used.has(k) || used.has(a) || cards.length >= 8) return;
    used.add(k);
    used.add(a);
    cards.push({
      question: `¿Qué es «${shortTerm(term)}»?`,
      answer: sentence(definitionBody(term, answer), 190),
      hint: `Revisa la sección «${section}» de ${source}.`,
      category: capitalize(section.length > 32 ? `${section.slice(0, 30)}…` : section),
    });
  };
  for (const p of uniqueBy(corpus.pairs, (x) => x.term)) add(p.term, p.definition, p.section, p.source);
  for (const t of topTerms(corpus, 14)) {
    if (cards.length >= 6) break;
    const [s] = sentencesAbout(corpus, t.text, 1);
    if (s) add(capitalize(shortTerm(t.text)), s.text, s.section, s.source);
  }
  return cards;
}

// ---------------------------------------------------------------- summary-like documents

interface Block {
  title: string;
  sentences: string[];
}

function conceptBlocks(corpus: Corpus, count: number, perBlock: number): Block[] {
  const used = new Set<string>();
  const blocks: Block[] = [];
  for (const t of topTerms(corpus, count * 3)) {
    if (blocks.length >= count) break;
    const found = sentencesAbout(corpus, t.text, perBlock + 1, used).filter(
      (s) => !blocks.some((b) => b.sentences.some((x) => similarity(x, s.text) > 0.7)),
    );
    const chosen = found.slice(0, perBlock);
    if (chosen.length === 0) continue;
    chosen.forEach((s) => used.add(s.text));
    const title = capitalize(shortTerm(t.text));
    blocks.push({
      title,
      sentences: chosen.map((s) => {
        const m = /^([^:]{2,45}):\s+(\S.*)$/.exec(s.text);
        return m && norm(m[1]) === norm(title) ? capitalize(m[2]) : s.text;
      }),
    });
  }
  // Tiny sources: fall back to the document's own sections.
  if (blocks.length === 0) {
    for (const sec of corpus.sections.slice(0, count)) blocks.push({title: capitalize(sec.title), sentences: sec.sentences.slice(0, perBlock)});
  }
  return blocks;
}

function highlightAuthors(text: string, corpus: Corpus, p: Personalization, sources: SourceLike[]): string {
  if (!p.highlightAuthors) return text;
  const authors = detectAuthors(sources.map((s) => s.content ?? '').join('\n'));
  let out = text;
  for (const a of authors) {
    const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`(?<!>)${escaped}(?!<)`, 'g'), `<mark class="author-highlight" data-color="${p.authorHighlightColor || 'amber'}">${a}</mark>`);
  }
  return out;
}

function buildSummary(corpus: Corpus, p: Personalization, sources: SourceLike[], nb?: string): {title: string; text: string} {
  const topic = mainTopic(corpus, nb);
  const sectionCount = {bajo: 3, medio: 4, alto: 5, detallista: 6}[p.quality ?? 'alto'] ?? 4;
  const perBlock = {conciso: 1, intermedio: 2, detallado: 3}[p.length ?? 'intermedio'] ?? 2;
  const blocks = conceptBlocks(corpus, sectionCount, perBlock);
  const bulletFormat = p.format && p.format !== 'texto';
  const examples = exampleSentences(corpus);
  const out: string[] = [`## Resumen: ${topic}`, ''];

  const n = corpus.sourceTitles.length;
  out.push(
    `Este resumen reúne las ideas centrales de ${n === 1 ? `«${corpus.title}»` : `${n} fuentes de tu cuaderno`}, organizadas por los conceptos que más pesan en el material${blocks.length > 0 ? `: ${blocks.slice(0, 3).map((b) => b.title.toLowerCase()).join(', ')}` : ''}.`,
    '',
  );

  if (p.generateIndex && blocks.length > 0) {
    out.push('### Índice de contenidos');
    blocks.forEach((b, i) => out.push(`${i + 1}. [${b.title}](#${slug(b.title)})`));
    out.push('', '---', '');
  }

  blocks.forEach((b, i) => {
    out.push(`### ${b.title}`);
    if (bulletFormat) b.sentences.forEach((s) => out.push(`- ${sentence(s, 230)}`));
    else out.push(b.sentences.map((s) => sentence(s, 230)).join(' '));
    if (p.addExamples) {
      const ex = examples.find((e) => b.sentences.every((s) => e.text !== s) && queryStems(b.title).some((q) => e.stems.has(q))) ?? examples[i];
      out.push('', ex
        ? `> **Ejemplo:** ${sentence(ex.text.replace(/^(Por ejemplo|Ej\.|P\. ?ej\.),?\s*/i, ''), 200).replace(/^./, (c) => c.toUpperCase())}`
        : [`> **Para pensar:** ¿cómo explicarías ${b.title.toLowerCase()} con un caso de tu propia experiencia?`, `> **Para pensar:** ¿dónde has visto algo parecido a ${b.title.toLowerCase()} en la práctica?`, `> **Para pensar:** ¿qué pasaría si ${b.title.toLowerCase()} no se tuviera en cuenta?`][i % 3]);
    }
    out.push('');
  });

  const used = new Set(blocks.flatMap((b) => b.sentences));
  const rest = corpus.sentences
    .filter((s) => !used.has(s.text))
    .sort((a, b) => b.score - a.score)
    .filter((s, i, arr) => arr.slice(0, i).every((o) => similarity(o.text, s.text) < 0.6))
    .slice(0, 3);
  out.push('### Ideas para recordar');
  if (rest.length > 0) rest.forEach((s) => out.push(`- ${sentence(s.text, 200)}`));
  else blocks.forEach((b) => out.push(`- **${b.title}**: ${sentence(b.sentences[0], 160)}`));

  if (p.citeSources) out.push('', `> *Fuentes consultadas: ${corpus.sourceTitles.join(', ')}.*`);
  return {title: `Resumen de estudio: ${topic}`, text: highlightAuthors(out.join('\n'), corpus, p, sources)};
}

function buildGuide(corpus: Corpus, p: Personalization, sources: SourceLike[], nb?: string) {
  const topic = mainTopic(corpus, nb);
  const terms = topTerms(corpus, 5);
  const blocks = conceptBlocks(corpus, 4, 2);
  const concepts = uniqueBy(corpus.pairs, (x) => x.term).slice(0, 6);
  const conceptLines =
    concepts.length >= 3
      ? concepts.map((c) => `- **${shortTerm(c.term)}**: ${sentence(c.definition, 170)}`)
      : terms.map((t) => `- **${capitalize(shortTerm(t.text))}**: ${sentence(sentencesAbout(corpus, t.text, 1)[0]?.text ?? '', 170)}`).filter((l) => !l.endsWith(': .'));

  const objectives = (terms.length > 0 ? terms.slice(0, 4) : []).map((t, i) =>
    [
      `Explicar con tus propias palabras qué es ${shortTerm(t.text)}.`,
      `Identificar dónde y para qué se aplica ${shortTerm(t.text)}.`,
      `Relacionar ${shortTerm(t.text)} con el resto de los conceptos del material.`,
      `Reconocer ${shortTerm(t.text)} en un ejemplo concreto.`,
    ][i % 4],
  );

  const steps: string[] = [];
  steps.push(`**Lectura inicial (10 min)**: recorre «${corpus.title}» completa sin detenerte; subraya los términos que se repiten.`);
  blocks.forEach((b, i) =>
    steps.push(
      [
        `**${b.title} (10 min)**: lee la idea central, reescríbela en una frase y verifica con el material.`,
        `**${b.title} (10 min)**: identifica una definición y un ejemplo; explícalos en voz alta.`,
        `**${b.title} (10 min)**: relaciónalo con el concepto anterior y anota en qué se diferencian.`,
      ][i % 3],
    ),
  );
  steps.push('**Repaso activo (15 min)**: cierra los apuntes y responde las preguntas de autoevaluación de abajo.');
  steps.push('**Cierre (5 min)**: anota lo que no recordaste y prográmalo para tu próxima sesión.');

  const questions = terms.slice(0, 5).map((t, i) =>
    [
      `¿Qué es ${shortTerm(t.text)} y por qué importa en este material?`,
      `¿Con qué otros conceptos se relaciona ${shortTerm(t.text)}?`,
      `¿Cómo explicarías ${shortTerm(t.text)} a un compañero que no leyó el texto?`,
      `¿Qué ejemplo propio podrías dar de ${shortTerm(t.text)}?`,
      `¿Qué pasaría si ${shortTerm(t.text)} faltara o se aplicara mal?`,
    ][i % 5],
  );

  const md = [
    `## Guía de estudio: ${topic}`,
    '',
    ...(p.generateIndex
      ? ['### Índice', '1. [Objetivos de aprendizaje](#objetivos-de-aprendizaje)', '2. [Conceptos clave](#conceptos-clave)', '3. [Plan de estudio paso a paso](#plan-de-estudio-paso-a-paso)', '4. [Preguntas de autoevaluación](#preguntas-de-autoevaluacion)', '']
      : []),
    '### Objetivos de aprendizaje',
    ...objectives.map((o) => `- ${o}`),
    '',
    '### Conceptos clave',
    ...conceptLines,
    '',
    '### Plan de estudio paso a paso',
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    '### Preguntas de autoevaluación',
    ...questions.map((q, i) => `${i + 1}. ${q}`),
    ...(p.citeSources ? ['', `> *Fuentes consultadas: ${corpus.sourceTitles.join(', ')}.*`] : []),
  ].join('\n');

  const structured = [
    {title: 'Objetivos de aprendizaje', points: objectives, note: ''},
    {title: 'Conceptos clave', points: conceptLines.map((l) => l.replace(/^- /, '').replace(/\*\*/g, '')), note: ''},
    {title: 'Plan de estudio', points: steps.map((s) => s.replace(/\*\*/g, '')), note: 'Tiempo estimado: 45-60 minutos.'},
    {title: 'Autoevaluación', points: questions, note: ''},
  ];
  return {title: `Guía de estudio: ${topic}`, text: highlightAuthors(md, corpus, p, sources), structured};
}

function buildSlides(corpus: Corpus, p: Personalization, sources: SourceLike[], nb?: string) {
  const topic = mainTopic(corpus, nb);
  const blocks = conceptBlocks(corpus, 5, 3);
  const slides: Array<{title: string; points: string[]; note: string}> = [];
  slides.push({
    title: topic,
    points: [
      `Basado en ${corpus.sourceTitles.length === 1 ? `«${corpus.title}»` : `${corpus.sourceTitles.length} fuentes del cuaderno`}`,
      ...(blocks.length > 0 ? [`Conceptos que veremos: ${blocks.map((b) => b.title.toLowerCase()).join(', ')}`] : []),
    ],
    note: 'Presenta el tema y anticipa el recorrido.',
  });
  for (const b of blocks) {
    slides.push({
      title: b.title,
      points: b.sentences.map((s) => trimSentence(s, 120)),
      note: `Explica ${b.title.toLowerCase()} con tus propias palabras y apóyate en un ejemplo.`,
    });
  }
  const used = new Set(blocks.flatMap((b) => b.sentences));
  const takeaways = corpus.sentences
    .filter((s) => !used.has(s.text))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => trimSentence(s.text, 120));
  slides.push({
    title: 'Ideas para llevarse',
    points: takeaways.length > 0 ? takeaways : blocks.map((b) => `${b.title}: ${trimSentence(b.sentences[0], 90)}`),
    note: 'Resume y deja tiempo para preguntas.',
  });
  slides.push({
    title: 'Para seguir repasando',
    points: ['Practica con flashcards de los conceptos clave', 'Responde un cuestionario para medir lo aprendido', 'Explica el tema en voz alta sin mirar tus apuntes'],
    note: 'Cierra con una invitación a la práctica activa.',
  });

  const md = [
    `## Presentación: ${topic}`,
    '',
    ...slides.flatMap((s, i) => [`### Diapositiva ${i + 1}: ${s.title}`, ...s.points.map((pt) => `- ${pt}`), '', `> *Nota del orador: ${s.note}*`, '']),
    ...(p.citeSources ? [`> *Fuentes consultadas: ${corpus.sourceTitles.join(', ')}.*`] : []),
  ].join('\n');
  return {title: `Presentación: ${topic}`, text: highlightAuthors(md, corpus, p, sources), structured: slides};
}

// ---------------------------------------------------------------- podcast

function buildPodcast(corpus: Corpus, nb?: string) {
  const topic = mainTopic(corpus, nb);
  const terms = topTerms(corpus, 3);
  const facts = terms
    .map((t) => ({term: shortTerm(t.text), def: trimSentence(sentencesAbout(corpus, t.text, 1)[0]?.text ?? corpus.pairs.find((p) => norm(shortTerm(p.term)) === norm(shortTerm(t.text)))?.definition ?? '', 150)}))
    .filter((f) => f.def);
  const top = trimSentence(
    corpus.sentences
      .slice()
      .sort((a, b) => b.score - a.score)
      .find((s) => facts.every((f) => similarity(f.def, s.text) < 0.5))?.text ?? '',
    150,
  );
  const S = 'Sofía (Host)';
  const L = 'Lucas (Co-host)';
  const lines: Array<[string, string]> = [];
  lines.push([S, `¡Hola a todos! Hoy repasamos «${topic}». Lucas, para arrancar, ¿de qué va este material?`]);
  lines.push([L, `Hola, Sofía. ${facts.length > 1 ? `Gira en torno a ${facts.map((f) => f.term).join(', ')}.` : 'Es un material con varias ideas conectadas.'}${top ? ` Una idea que lo resume bien: ${finish(lowerFirst(top))}` : ''}`]);
  const openers = ['Empecemos por', 'Vamos ahora con', 'Y no puede faltar'];
  const replies = ['Según el material,', 'El texto lo plantea así:', 'Lo importante aquí es que'];
  const questions = ['¿qué tenemos que saber?', '¿cómo se conecta con lo anterior?', '¿qué debería recordar un estudiante?'];
  facts.forEach((f, i) => {
    lines.push([S, `${openers[i % 3]} ${f.term}: ${questions[i % 3]}`]);
    lines.push([L, `${replies[i % 3]} ${finish(lowerFirst(f.def))}`]);
  });
  lines.push([S, 'Para quedarnos con algo práctico: ¿cómo lo estudiarías para no olvidarlo?']);
  lines.push([L, 'Yo lo explicaría en voz alta con mis palabras y después lo contrastaría con el texto, para ver qué detalle se me escapó.']);
  lines.push([S, `Resumiendo: ${facts.length > 0 ? facts.map((f) => f.term).join(', ') : topic} son las piezas que conviene dominar.`]);
  lines.push([L, 'Y ahora toca ponerse a prueba con las flashcards y el cuestionario. ¡Mucho éxito en el repaso!']);
  const limited = lines.slice(0, 10);
  let t = 0;
  return limited.map(([speaker, text]) => {
    const stamp = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    t += Math.max(8, Math.round(text.split(/\s+/).length / 2.6));
    return {speaker, text, timestamp: stamp};
  });
}

// ---------------------------------------------------------------- infographic

function buildInfographic(corpus: Corpus, nb?: string) {
  const topic = mainTopic(corpus, nb);
  const conceptCount = Math.max(corpus.pairs.length, Math.min(corpus.terms.length, 12));
  const pillars = topTerms(corpus, 4)
    .map((t, i) => {
      const s = sentencesAbout(corpus, t.text, 1)[0]?.text ?? corpus.pairs.find((p) => norm(shortTerm(p.term)) === norm(shortTerm(t.text)))?.definition;
      return s ? {title: `${i + 1}. ${capitalize(shortTerm(t.text))}`, desc: trimSentence(s, 120), color: 'highlight'} : null;
    })
    .filter((x): x is {title: string; desc: string; color: string} => x !== null);
  const takeaways = corpus.sentences
    .slice()
    .sort((a, b) => b.score - a.score)
    .filter((s, i, arr) => arr.slice(0, i).every((o) => similarity(o.text, s.text) < 0.6))
    .slice(0, 3)
    .map((s) => trimSentence(s.text, 150));
  const structured = {
    highlightStat: {
      number: String(conceptCount),
      label: `conceptos clave identificados en ${corpus.sourceTitles.length} ${corpus.sourceTitles.length === 1 ? 'fuente' : 'fuentes'}`,
    },
    stats: [
      {number: String(corpus.sourceTitles.length), label: corpus.sourceTitles.length === 1 ? 'fuente analizada' : 'fuentes analizadas'},
      {number: String(corpus.sections.length), label: corpus.sections.length === 1 ? 'sección' : 'secciones'},
      {number: String(corpus.sentences.length), label: 'ideas procesadas'},
    ],
    pillars,
    keyTakeaways: takeaways,
  };
  const md = [
    `### Síntesis visual: ${topic}`,
    '',
    `Se identificaron **${structured.highlightStat.number}** ${structured.highlightStat.label}.`,
    '',
    ...pillars.map((p) => `- **${p.title}**: ${p.desc}`),
    '',
    '#### Ideas para recordar',
    ...takeaways.map((t) => `- ${t}`),
  ].join('\n');
  return {structured, md, title: `Infografía: ${topic}`};
}

// ---------------------------------------------------------------- entry point

export function generateSimulatedArtifact(args: {
  artifactType: string;
  personalization?: Personalization;
  sources: SourceLike[];
  notebookTitle?: string;
}): SimulatedArtifact {
  const {artifactType, sources, notebookTitle: nb} = args;
  const p = args.personalization ?? {};
  const corpus = buildCorpus(sources);
  const citations = corpus.sourceTitles.map((t) => `Fuente: ${t}`);
  const topic = mainTopic(corpus, nb);
  const make = (title: string, summaryText: string, structuredData: unknown): SimulatedArtifact => ({
    title,
    artifactType,
    summaryText,
    citations,
    structuredData,
  });

  switch (artifactType) {
    case 'cuestionario': {
      const quiz = buildQuiz(corpus, 5);
      return make(
        `Cuestionario: ${topic}`,
        `### Cuestionario: ${topic}\n\n${quiz.length} preguntas de opción múltiple para comprobar qué tanto recuerdas de ${corpus.sourceTitles.length === 1 ? `«${corpus.title}»` : 'tus fuentes'}. Responde, revisa la explicación y repite las que falles.`,
        quiz,
      );
    }
    case 'modelo_examen': {
      const quiz = buildQuiz(corpus, 5);
      const letters = ['A', 'B', 'C', 'D'];
      const body = quiz.flatMap((q, i) => [`### Pregunta ${i + 1}`, q.question, ...q.options.map((o, j) => `- ${letters[j]}) ${o}`), '']);
      const key = quiz.map((q, i) => `${i + 1}. ${letters[q.options.indexOf(q.correctAnswer)]}: ${q.explanation}`);
      return make(
        `Modelo de examen: ${topic}`,
        [`## Modelo de examen: ${topic}`, '', 'Elige la opción correcta en cada pregunta. Tiempo sugerido: 15 minutos.', '', ...body, '### Clave de respuestas', ...key].join('\n'),
        quiz,
      );
    }
    case 'flashcards': {
      const cards = buildFlashcards(corpus);
      return make(
        `Flashcards: ${topic}`,
        `### Flashcards: ${topic}\n\n${cards.length} tarjetas con los conceptos clave del material. Intenta responder en voz alta antes de voltear cada una.`,
        cards,
      );
    }
    case 'audio_podcast': {
      const lines = buildPodcast(corpus, nb);
      return make(
        `Podcast de estudio: ${topic}`,
        [`### Guion del podcast: ${topic}`, '', ...lines.map((l) => `**${l.speaker}** (${l.timestamp}): ${l.text}`)].join('\n\n'),
        lines,
      );
    }
    case 'infografia': {
      const info = buildInfographic(corpus, nb);
      return make(info.title, info.md, info.structured);
    }
    case 'guia': {
      const g = buildGuide(corpus, p, sources, nb);
      return make(g.title, g.text, g.structured);
    }
    case 'presentacion': {
      const s = buildSlides(corpus, p, sources, nb);
      return make(s.title, s.text, s.structured);
    }
    default: {
      const s = buildSummary(corpus, p, sources, nb);
      return make(s.title, s.text, null);
    }
  }
}

// ---------------------------------------------------------------- refine

export function refineSimulated(args: {currentContent: string; comment: string; sources: SourceLike[]}): string {
  const {comment} = args;
  const current = (args.currentContent || '').replace(/\r\n?/g, '\n');
  const corpus = buildCorpus(args.sources ?? []);
  const c = norm(comment);
  let lines = current.split('\n');
  let changed = false;

  const wantsShort = /\b(corto|breve|conciso|resum|reduc|acort|menos (texto|largo)|sintetiz)/.test(c);
  const wantsExamples = /\bejemplo/.test(c);
  const wantsDetail = /\b(detall|profund|ampli|expand|mas (informacion|contenido)|desarroll)/.test(c) && !wantsShort;
  const wantsSimple = /\b(simpl|sencill|facil|claro|claridad|entend|lenguaje)/.test(c);

  const splitHeads = (src: string[]) => {
    const sections: Array<{head: string | null; body: string[]}> = [{head: null, body: []}];
    for (const l of src) {
      if (/^#{1,6}\s/.test(l)) sections.push({head: l, body: []});
      else sections[sections.length - 1].body.push(l);
    }
    return sections;
  };
  const join = (secs: Array<{head: string | null; body: string[]}>) => secs.flatMap((s) => (s.head ? [s.head, ...s.body] : s.body));

  if (wantsShort) {
    const secs = splitHeads(lines).map((s) => {
      let bullets = 0;
      const body: string[] = [];
      for (const l of s.body) {
        if (!l.trim()) {
          if (body.length && body[body.length - 1] !== '') body.push('');
          continue;
        }
        if (/^>/.test(l)) continue;
        if (/^\s*([-*+]|\d+[.)])\s/.test(l)) {
          if (++bullets <= 2) body.push(l);
          continue;
        }
        const first = l.split(/(?<=[.!?])\s+/)[0];
        body.push(first);
      }
      return {head: s.head, body};
    });
    lines = join(secs);
    changed = true;
  }

  if (wantsSimple) {
    lines = lines.map((l) => {
      if (/^#{1,6}\s/.test(l) || !l.trim()) return l;
      const m = /^(\s*(?:[-*+]|\d+[.)])\s+|>\s*)?(.*)$/.exec(l)!;
      const body = m[2]
        .split(/(?<=[.!?])\s+/)
        .map((s) => (s.length > 130 ? `${finish(trimSentence(s, 120))}` : s))
        .join(' ');
      return `${m[1] ?? ''}${body}`;
    });
    changed = true;
  }

  if (wantsExamples) {
    const examples = exampleSentences(corpus);
    const secs = splitHeads(lines);
    let used = 0;
    for (const s of secs) {
      if (!s.head || /Índice|Ideas para recordar|Fuentes|Clave de respuestas/i.test(s.head) || s.body.some((l) => /Ejemplo/i.test(l))) continue;
      const stems = queryStems(s.head);
      const own = corpus.sentences
        .filter((x) => stems.some((q) => x.stems.has(q)) && !s.body.some((l) => l.includes(x.text.slice(0, 30))))
        .sort((a, b) => b.score - a.score)[0];
      const ex = examples.find((e) => stems.some((q) => e.stems.has(q))) ?? examples[used++] ?? own;
      const text = ex
        ? `> **Ejemplo:** ${sentence(ex.text.replace(/^[^:]{2,45}:\s+(?=\S)/, '').replace(/^(Por ejemplo|Ej\.|P\. ?ej\.),?\s*/i, ''), 200).replace(/^./, (c) => c.toUpperCase())}`
        : `> **Ejemplo:** piensa en una situación cotidiana en la que aparezca ${s.head.replace(/^#+\s*(Diapositiva \d+:\s*)?/, '').toLowerCase()} y descríbela en dos líneas.`;
      let end = s.body.length;
      while (end > 0 && !s.body[end - 1].trim()) end--;
      s.body.splice(end, 0, '', text);
    }
    lines = join(secs);
    changed = true;
  }

  if (wantsDetail) {
    const secs = splitHeads(lines);
    for (const s of secs) {
      if (!s.head || /Índice|Fuentes|Clave de respuestas|Ejemplo/i.test(s.head)) continue;
      const stems = queryStems(s.head);
      const extra = corpus.sentences
        .filter((x) => stems.some((q) => x.stems.has(q)) && !s.body.some((l) => similarity(l, x.text) > 0.6))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);
      if (extra.length === 0) continue;
      let end = s.body.length;
      while (end > 0 && !s.body[end - 1].trim()) end--;
      const bulleted = s.body.some((l) => /^\s*[-*+]\s/.test(l));
      s.body.splice(end, 0, ...(bulleted ? extra.map((x) => `- ${sentence(x.text, 230)}`) : ['', extra.map((x) => sentence(x.text, 230)).join(' ')]));
    }
    lines = join(secs);
    changed = true;
  }

  let out = lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();

  if (!changed) {
    // Free-form request: add a section that addresses it with the sources.
    const stems = queryStems(comment);
    let found = corpus.sentences
      .map((s) => ({s, hits: stems.filter((q) => s.stems.has(q)).length}))
      .filter((x) => x.hits > 0 && !out.includes(x.s.text.slice(0, 40)))
      .sort((a, b) => b.hits - a.hits || b.s.score - a.s.score)
      .map((x) => x.s);
    if (found.length === 0) {
      found = corpus.sentences.slice().sort((a, b) => b.score - a.score).filter((s) => !out.includes(s.text.slice(0, 40)));
    }
    found = found.filter((s, i, arr) => arr.slice(0, i).every((o) => similarity(o.text, s.text) < 0.6)).slice(0, 3);
    const matched = corpus.pairs.find((p) => c.includes(norm(shortTerm(p.term))));
    const subject = matched ? shortTerm(matched.term) : queryWords(comment, 3);
    if (found.length > 0) {
      out += `\n\n### ${subject ? `Ampliación: ${capitalize(subject)}` : 'Complemento a partir de tus fuentes'}\n${found.map((s) => `- ${sentence(s.text, 230)}`).join('\n')}`;
    }
  }
  return out || current;
}

function queryWords(text: string, max: number): string {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const w of tokenize(text)) {
    const n = norm(w);
    if (n.length < 4 || ['quiero', 'puedes', 'podrias', 'hazlo', 'mejor', 'agrega', 'agregar', 'incluye', 'incluir', 'favor', 'explica', 'explicame', 'explicar', 'aclara', 'aclarar', 'habla', 'hablar', 'desarrolla', 'esta', 'este', 'sobre', 'mas', 'menos', 'poner', 'cambia', 'cambiar'].includes(n)) continue;
    const s = stem(w);
    if (seen.has(s)) continue;
    seen.add(s);
    words.push(w);
    if (words.length >= max) break;
  }
  return words.join(' ');
}
