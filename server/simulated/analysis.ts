import {
  buildCorpus,
  capitalize,
  detectAuthors,
  norm,
  sentencesAbout,
  shortTerm,
  topTerms,
  trimSentence,
  finish,
  definitionBody,
  uniqueBy,
  type Corpus,
  type SourceLike,
} from './text';

type Importance = 'clave' | 'alta' | 'media';

export interface KeyConcept {
  term: string;
  definition: string;
  importance: Importance;
}

const baseName = (title: string): string => title.replace(/\.[^/.]+$/, '').trim() || title;

function keyConcepts(corpus: Corpus, max: number): KeyConcept[] {
  const out: KeyConcept[] = [];
  const used = new Set<string>();
  const push = (term: string, definition: string) => {
    const k = norm(shortTerm(term));
    if (!definition || used.has(k) || out.length >= max) return;
    used.add(k);
    out.push({
      term: capitalize(shortTerm(term)),
      definition: `${finish(trimSentence(definition, 170))}`,
      importance: out.length < 2 ? 'clave' : out.length < 4 ? 'alta' : 'media',
    });
  };
  for (const p of uniqueBy(corpus.pairs, (x) => x.term)) push(p.term, p.definition);
  for (const t of topTerms(corpus, max * 2)) {
    if (out.length >= max) break;
    push(t.text, sentencesAbout(corpus, t.text, 1)[0]?.text ?? '');
  }
  return out;
}

function mainTopic(corpus: Corpus, notebookTitle?: string): string {
  if (corpus.sourceTitles.length === 1) return baseName(corpus.title);
  if (notebookTitle?.trim()) return notebookTitle.trim();
  const [a, b] = topTerms(corpus, 2);
  return a && b ? `${capitalize(shortTerm(a.text))} y ${shortTerm(b.text)}` : baseName(corpus.title);
}

function subtopics(corpus: Corpus): string[] {
  const titles = uniqueBy(
    corpus.sections.map((s) => s.title).filter((t) => !corpus.sourceTitles.includes(t)),
    (t) => t,
  );
  if (titles.length >= 3) return titles.slice(0, 6).map(capitalize);
  return topTerms(corpus, 5).map((t) => capitalize(shortTerm(t.text)));
}

function structure(corpus: Corpus): string[] {
  const titles = uniqueBy(corpus.sections.map((s) => s.title), (t) => t);
  const labels = titles.length >= 2 ? titles : topTerms(corpus, 4).map((t) => capitalize(shortTerm(t.text)));
  return labels.slice(0, 6).map((t, i) => `${i + 1}. ${capitalize(t)}`);
}

/** Heuristic equivalent of the notebook-level analysis (analyze-sources). */
export function analyzeSourcesSimulated(sources: SourceLike[], notebookTitle?: string) {
  const corpus = buildCorpus(sources);
  const concepts = keyConcepts(corpus, 6);
  const topSentences = corpus.sentences.slice().sort((a, b) => b.score - a.score);
  const names = concepts.map((c) => c.term);
  return {
    mainTopic: mainTopic(corpus, notebookTitle),
    subtopics: subtopics(corpus),
    keyConcepts: concepts,
    structure: structure(corpus),
    mentionedAuthors: detectAuthors(sources.map((s) => s.content ?? '').join('\n')),
    importantDefinitions: uniqueBy(corpus.pairs, (p) => p.term)
      .slice(0, 4)
      .map((p) => ({term: capitalize(shortTerm(p.term)), explanation: `${finish(trimSentence(p.definition, 170))}`})),
    conceptRelationships: names.length >= 2
      ? names.slice(0, 3).flatMap((n, i) => (names[i + 1] ? [`«${n}» se conecta con «${names[i + 1]}» dentro del desarrollo del material.`] : []))
      : [],
    evaluationPoints: names.slice(0, 3).map((n) => `Explicar con tus palabras qué es «${n}» y cómo se aplica según las fuentes.`).concat(
      topSentences[0] ? [`Reconocer la idea: «${trimSentence(topSentences[0].text, 120)}».`] : [],
    ),
  };
}

/** Heuristic equivalent of process-and-analyze-source for a single source. */
export function analyzeSingleSourceSimulated(source: SourceLike & {content: string}) {
  const corpus = buildCorpus([source]);
  const concepts = keyConcepts(corpus, 5);
  const authors = detectAuthors(source.content);
  const central = corpus.sentences.slice().sort((a, b) => b.score - a.score).slice(0, 3);
  const title = baseName(source.title ?? 'Fuente');
  const terms = topTerms(corpus, 3).map((t) => shortTerm(t.text));
  const summary = `«${title}» reúne ${corpus.wordCount} palabras${corpus.sections.length > 1 ? ` en ${corpus.sections.length} secciones` : ''}${terms.length ? ` y se centra en ${terms.join(', ')}` : ''}.${central[0] ? ` Idea central: ${finish(trimSentence(central[0].text, 200))}` : ''}`;
  return {
    corpus,
    concepts,
    authors,
    analysisSummary: summary,
    keyDetails: central.map((s) => `${finish(trimSentence(s.text, 200))}`),
    notebook: {
      mainTopic: mainTopic(corpus),
      subtopics: subtopics(corpus),
      structure: structure(corpus),
      importantDefinitions: uniqueBy(corpus.pairs, (p) => p.term)
        .slice(0, 4)
        .map((p) => ({term: capitalize(shortTerm(p.term)), explanation: `${finish(trimSentence(p.definition, 170))}`})),
      evaluationPoints: concepts.slice(0, 3).map((c) => `Explicar «${c.term}» y su aplicación según «${title}».`),
    },
  };
}
