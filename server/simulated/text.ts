// Text utilities shared by the heuristic (non-LLM) generators in server/simulated/.
// Everything here is pure and works on the student's real source content.

export interface SourceLike {
  title?: string;
  content?: string;
  type?: string;
}

export interface Sentence {
  text: string;
  stems: Set<string>;
  source: string;
  section: string;
  /** Position inside its section (0 = first). */
  index: number;
  /** General importance inside the corpus (higher = more central). */
  score: number;
}

export interface Pair {
  term: string;
  definition: string;
  source: string;
  section: string;
}

export interface Term {
  text: string;
  stem: string;
  score: number;
  count: number;
}

export interface Section {
  title: string;
  sentences: string[];
}

export interface Corpus {
  title: string;
  sourceTitles: string[];
  sections: Array<Section & {source: string}>;
  sentences: Sentence[];
  pairs: Pair[];
  terms: Term[];
  wordCount: number;
}

const STOPWORDS = new Set(
  (
    'a al algo algunas algunos ante antes aquel aquella aquellas aquellos aqui asi aun aunque bajo bien cada casi como con contra cual cuales cuando cuanto cuyo de debe deben del desde donde dos e el ella ellas ello ellos en entre era eran es esa esas ese eso esos esta estaba estan estar este esto estos fue fueron ha haber habia hace hacen hacer han hasta hay la las le les lo los mas me mi mientras misma mismo mucho muy nada ni no nos nosotros nuestra nuestro o os otra otras otro otros para pero poco por porque puede pueden que quien quienes se sea segun ser si sido siendo sin sino sobre sois solo son soy su sus tambien tanto te tendra tenemos tener tengo ti tiene tienen todas todo todos tras tu tus un una unas uno unos usa usan usar uso va vamos van vez vosotros vuestro y ya yo ' +
    'ademas ahora alguien alguno ambos aparece cierto cierta ciertos cierto cosas cuenta dentro durante ejemplo existe forma general gran hacia incluso lugar manera mayor mejor menos mismos muchos nuevo nuevos parte partir pueda puedo punto sera sido tal tipo todavia toda través usted ustedes varios veces ver vez via' +
    ' cual quiero quiere explica explicame dime dame cuales cuantos cuantas hablar habla trata tratan material materiales fuente fuentes texto textos documento documentos tema temas'
  ).split(/\s+/),
);

const QUESTION_WORDS = new Set(
  'que como cual cuales cuando donde quien quienes cuanto cuantos cuantas porque explica explicame dime dame resume resumeme resumen define definir definicion significa significado ejemplo ejemplos diferencia diferencias entre'.split(' '),
);

export const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function stem(word: string): string {
  const w = norm(word);
  if (w.length <= 4) return w;
  if (w.endsWith('ciones')) return `${w.slice(0, -6)}cion`;
  if (w.endsWith('es') && w.length > 5) return w.slice(0, -2);
  if (w.endsWith('s')) return w.slice(0, -1);
  return w;
}

export function isStopword(word: string): boolean {
  return STOPWORDS.has(norm(word));
}

export function tokenize(text: string): string[] {
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}_-]*/gu) ?? [];
}

/** Meaningful stems of a free-text question (stopwords and question words removed). */
export function queryStems(text: string): string[] {
  const out: string[] = [];
  for (const w of tokenize(text)) {
    const n = norm(w);
    if (n.length < 3 || STOPWORDS.has(n) || QUESTION_WORDS.has(n)) continue;
    out.push(stem(w));
  }
  return Array.from(new Set(out));
}

/** Meaningful words of a question in their original spelling and order. */
export function queryWords(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const w of tokenize(text)) {
    const n = norm(w);
    if (n.length < 3 || STOPWORDS.has(n) || QUESTION_WORDS.has(n)) continue;
    const s = stem(w);
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(w);
  }
  return out;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function seededRng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
export const lowerFirst = (s: string): string => {
  // Keep acronyms and proper-looking words (second letter uppercase) intact.
  if (/^[A-ZÁÉÍÓÚÑ]{2,}/.test(s)) return s;
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
};

export function stripMarkdown(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1$2')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const ABBREVIATIONS = /\b(Dr|Dra|Sr|Sra|Prof|etc|ej|vs|pág|págs|Fig|aprox|Ud|Uds)\./g;

/** Splits text (markdown allowed) into clean, self-contained sentences. */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  for (const rawLine of text.replace(/\r\n?/g, '\n').split('\n')) {
    let line = rawLine.trim();
    if (!line || /^[-*_=]{3,}$/.test(line) || /^```/.test(line) || /^\|?[-:| ]+\|?$/.test(line)) continue;
    if (/^#{1,6}\s/.test(line)) continue;
    line = line.replace(/^\s*(?:[-*+•]|\d+[.)])\s+/, '').replace(/^>\s*/, '');
    line = stripMarkdown(line);
    if (!line) continue;
    const protectedLine = line.replace(ABBREVIATIONS, (m) => m.replace('.', '§'));
    const parts = protectedLine.split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÑ¿¡"«(\d])/);
    for (const p of parts) {
      const s = p.replace(/§/g, '.').trim();
      if (s.length >= 25 && s.split(/\s+/).length >= 4) out.push(s);
    }
  }
  return out;
}

/** Cuts a sentence to a readable length at a clause boundary. */
export function trimSentence(s: string, max = 180): string {
  let t = stripMarkdown(s).replace(/\s*[.;:]+$/, '');
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const boundary = Math.max(cut.lastIndexOf(', '), cut.lastIndexOf('; '), cut.lastIndexOf(' y '), cut.lastIndexOf(' pero '));
  if (boundary > max * 0.55) return cut.slice(0, boundary).replace(/[,;:\s]+$/, '');
  // No clause boundary: keep a slightly longer full sentence rather than cutting mid-thought.
  if (t.length <= max * 1.35) return t;
  t = cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max);
  return `${t.replace(/[,;:\s]+$/, '')}…`;
}

/** Closes a trimmed sentence with a period unless it already ends with an ellipsis. */
export const finish = (s: string): string => (s.endsWith('…') ? s : `${s}.`);

/** Drops the "X es ..." subject so a definition reads as the answer to "¿Qué es X?". */
export function definitionBody(term: string, definition: string): string {
  const m = /^(?:(?:El|La|Los|Las|Un|Una)\s+)?(.{1,70}?)\s+(?:es|son|se define como|se denomina|se llama|consiste en|se refiere a|significa)\s+(.{15,})$/.exec(definition);
  if (m && norm(m[1]).includes(norm(shortTerm(term).split(' ')[0]))) return capitalize(m[2]);
  return definition;
}

const PLACEHOLDER = /Material cargado: ".*" Archivo registrado en formato/i;

function parseSections(title: string, content: string): Section[] {
  const sections: Section[] = [];
  let current: {title: string; lines: string[]} = {title, lines: []};
  const flush = () => {
    const sentences = splitSentences(current.lines.join('\n'));
    if (sentences.length > 0) sections.push({title: current.title, sentences});
  };
  for (const line of content.replace(/\r\n?/g, '\n').split('\n')) {
    const h = /^#{1,4}\s+(.*)$/.exec(line.trim());
    if (h) {
      flush();
      current = {title: stripMarkdown(h[1]).replace(/^(Cap[ií]tulo|Secci[oó]n)\s+\d+\s*[:.-]\s*/i, '').trim() || title, lines: []};
    } else {
      current.lines.push(line);
    }
  }
  flush();
  return sections;
}

const BOLD_PAIR = /^\s*(?:[-*•]|\d+[.)])?\s*\*\*(.+?)\*\*\s*[:\-–—]?\s*(.{15,})$/;
const PLAIN_PAIR = /^\s*(?:[-*•]|\d+[.)])?\s*([A-ZÁÉÍÓÚÑ][^:.\n]{1,55}?):\s+(.{20,})$/;
const IS_PATTERN =
  /^(?:(?:El|La|Los|Las|Un|Una)\s+)?([^,.;:]{3,55}?)\s+(?:es|son|se define como|se denomina|se llama|consiste en|se refiere a|significa)\s+(.{15,})$/;

function extractPairs(source: string, section: string, rawContent: string, sentences: string[]): Pair[] {
  const pairs: Pair[] = [];
  const seen = new Set<string>();
  const add = (term: string, definition: string) => {
    const t = stripMarkdown(term).replace(/[:.]+$/, '').trim();
    const d = stripMarkdown(definition).trim();
    if (!t || !d || t.split(/\s+/).length > 7 || seen.has(norm(t))) return;
    seen.add(norm(t));
    pairs.push({term: t, definition: d, source, section});
  };
  for (const line of rawContent.split('\n')) {
    const bold = BOLD_PAIR.exec(line);
    if (bold) {
      add(bold[1], bold[2]);
      continue;
    }
    const plain = PLAIN_PAIR.exec(line.replace(/\*\*/g, ''));
    if (plain && !/^(Nota|Ejemplo|Importante|Fuente|Consulta)\b/i.test(plain[1])) add(plain[1], plain[2]);
  }
  for (const s of sentences) {
    const m = IS_PATTERN.exec(s);
    if (m) {
      const t = m[1].trim();
      if (t.split(/\s+/).length <= 5 && !t.split(/\s+/).some((w) => /^(no|se|que|y|o|lo|le|ni|sin|su|sus)$/i.test(w))) add(capitalize(t), s);
    }
  }
  return pairs;
}

/** Builds the analyzed view (sentences, glossary pairs, key terms) of the selected sources. */
export function buildCorpus(sources: SourceLike[]): Corpus {
  const sections: Corpus['sections'] = [];
  const pairs: Pair[] = [];
  const sourceTitles: string[] = [];
  let wordCount = 0;

  for (const s of sources) {
    const title = (s.title ?? 'Material').trim() || 'Material';
    const content = PLACEHOLDER.test(s.content ?? '') ? '' : (s.content ?? '');
    sourceTitles.push(title);
    wordCount += content.split(/\s+/).filter(Boolean).length;
    const parsed = parseSections(title, content);
    for (const sec of parsed) {
      sections.push({...sec, source: title});
      pairs.push(...extractPairs(title, sec.title, sectionRaw(content, sec.title, title), sec.sentences));
    }
  }

  // Term frequency over every sentence.
  const counts = new Map<string, {surface: Map<string, number>; count: number; bonus: number}>();
  const bump = (word: string, bonus = 0, mid = false) => {
    const n = norm(word);
    if (n.length < 4 || STOPWORDS.has(n) || /^\d+$/.test(n)) return;
    const k = stem(word);
    const entry = counts.get(k) ?? {surface: new Map(), count: 0, bonus: 0};
    entry.count += 1;
    entry.bonus += bonus + (mid && /^[A-ZÁÉÍÓÚÑ]/.test(word) ? 0.6 : 0);
    entry.surface.set(word, (entry.surface.get(word) ?? 0) + 1);
    counts.set(k, entry);
  };
  for (const sec of sections) {
    for (const w of tokenize(sec.title)) bump(w, 1.2);
    for (const sentence of sec.sentences) {
      const words = tokenize(sentence);
      words.forEach((w, i) => bump(w, 0, i > 0));
    }
  }
  for (const p of pairs) for (const w of tokenize(p.term)) bump(w, 2.5);

  const terms: Term[] = Array.from(counts.entries())
    .map(([k, e]) => {
      const surface = Array.from(e.surface.entries()).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0][0];
      const display = surface;
      return {text: display, stem: k, count: e.count, score: e.count + e.bonus};
    })
    .sort((a, b) => b.score - a.score);

  const termScore = new Map(terms.map((t) => [t.stem, t.score]));
  const sentences: Sentence[] = [];
  for (const sec of sections) {
    sec.sentences.forEach((text, index) => {
      const stems = new Set(tokenize(text).filter((w) => !isStopword(w) && norm(w).length >= 4).map(stem));
      let score = 0;
      for (const st of stems) score += termScore.get(st) ?? 0;
      score = stems.size > 0 ? score / Math.sqrt(stems.size) : 0;
      if (index === 0) score *= 1.15;
      if (/\b(es|son|consiste|se define|permite|significa|garantiza|busca)\b/i.test(text)) score *= 1.1;
      if (text.length > 280) score *= 0.7;
      if (text.length < 45) score *= 0.75;
      sentences.push({text, stems, source: sec.source, section: sec.title, index, score});
    });
  }

  return {
    title: sourceTitles[0] ?? 'Material',
    sourceTitles,
    sections,
    sentences,
    pairs,
    terms,
    wordCount,
  };
}

/** Raw lines belonging to a section (so glossary patterns keep their markdown). */
function sectionRaw(content: string, sectionTitle: string, fallbackTitle: string): string {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let inside = sectionTitle === fallbackTitle;
  for (const line of lines) {
    const h = /^#{1,4}\s+(.*)$/.exec(line.trim());
    if (h) {
      const t = stripMarkdown(h[1]).replace(/^(Cap[ií]tulo|Secci[oó]n)\s+\d+\s*[:.-]\s*/i, '').trim();
      inside = t === sectionTitle;
      continue;
    }
    if (inside) out.push(line);
  }
  return out.join('\n');
}

/** Short form of a glossary term ("IaaS (Infraestructura como Servicio)" -> "IaaS"). */
export const shortTerm = (t: string): string => t.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim() || t;

export function topTerms(corpus: Corpus, n: number): Term[] {
  const out: Term[] = [];
  const covered = new Set<string>();
  const tokensOf = (text: string) => tokenize(text).filter((w) => !isStopword(w) && norm(w).length >= 3).map(stem);
  const authorTokens = new Set(
    detectAuthors(corpus.sentences.map((s) => s.text).join('\n')).flatMap((a) => tokensOf(a)),
  );

  const take = (text: string, score: number): boolean => {
    const tokens = tokensOf(text);
    if (tokens.length === 0 || tokens.every((k) => covered.has(k))) return false;
    if (tokens.length === 1 && authorTokens.has(tokens[0])) return false;
    tokens.forEach((k) => covered.add(k));
    out.push({text, stem: norm(text), score, count: 1});
    return out.length >= n;
  };

  // Glossary terms first (the author's own key concepts), then section titles, then frequent words.
  for (const p of corpus.pairs) if (take(shortTerm(p.term), 100)) return out;
  for (const sec of corpus.sections) {
    if (corpus.sourceTitles.includes(sec.title) || sec.title.split(/\s+/).length > 4) continue;
    if (take(sec.title, 90)) return out;
  }
  for (const t of corpus.terms) if (take(t.text, t.score)) return out;
  return out;
}

/** Best sentences mentioning `term` (word-stem match), most central first. */
export function sentencesAbout(corpus: Corpus, term: string, limit = 3, exclude: Set<string> = new Set()): Sentence[] {
  const stems = tokenize(term).filter((w) => !isStopword(w)).map(stem);
  if (stems.length === 0) return [];
  // Multi-word terms must match most of their words, otherwise unrelated sentences sneak in.
  const needed = stems.length === 1 ? 1 : stems.length >= 4 ? Math.ceil(stems.length * 0.6) : 2;
  return corpus.sentences
    .filter((s) => !exclude.has(s.text) && overlap(s, stems) >= Math.min(needed, stems.length))
    .sort((a, b) => b.score + overlap(b, stems) * 3 - (a.score + overlap(a, stems) * 3))
    .slice(0, limit);
}

function overlap(s: Sentence, stems: string[]): number {
  return stems.filter((st) => s.stems.has(st)).length;
}

/** Definition (sentence) for a term: glossary pair first, then the best sentence mentioning it. */
export function definitionFor(corpus: Corpus, term: string): string | null {
  const k = norm(shortTerm(term));
  const pair = corpus.pairs.find((p) => norm(shortTerm(p.term)) === k || norm(p.term) === norm(term));
  if (pair) return pair.definition;
  const [first] = sentencesAbout(corpus, term, 1);
  return first?.text ?? null;
}

/** Word-overlap similarity used to drop near-duplicate sentences. */
export function similarity(a: string, b: string): number {
  const sa = new Set(tokenize(a).map(stem));
  const sb = new Set(tokenize(b).map(stem));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  return inter / Math.min(sa.size, sb.size);
}

export function uniqueBy<T>(items: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = norm(key(i));
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Sentences that look like an applied example. */
export function exampleSentences(corpus: Corpus): Sentence[] {
  return corpus.sentences.filter((s) => /\b(por ejemplo|ej\.|p\. ?ej|como cuando|caso de|ejemplo)\b/i.test(s.text));
}

/** People / referents cited in the text ("según Eric Ries", "Osterwalder (2010)"). */
export function detectAuthors(text: string): string[] {
  const found = new Set<string>();
  const name = "[A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]+(?:\\s+(?:de|del|van|von|da)?\\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]+){0,2}";
  const patterns = [
    new RegExp(`\\b(?:[Ss]eg[uú]n|[Aa]utor(?:a)?|propuest[oa] por|cread[oa] por|desarrollad[oa] por|popularizad[oa] por|escrit[oa] por|formulad[oa] por)\\s+(${name})`, 'g'),
    new RegExp(`\\b(${name})\\s*\\((?:1[89]|20)\\d{2}\\)`, 'g'),
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const candidate = m[1].trim();
      const words = candidate.split(/\s+/);
      if (words.length < 2) continue; // a bare capitalized word is usually not a person
      if (words.some((w) => STOPWORDS.has(norm(w)) && !/^(de|del|van|von|da)$/i.test(w))) continue;
      found.add(candidate);
    }
  }
  return Array.from(found).slice(0, 6);
}
