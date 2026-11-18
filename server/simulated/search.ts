import {capitalize, hashString, seededRng, shuffle} from './text';

interface Result {
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

type Mode = 'general' | 'news' | 'factcheck';

type Template = (topic: string, q: string) => Result;

const enc = encodeURIComponent;

const GENERAL: Template[] = [
  (t, q) => ({
    domain: 'es.wikipedia.org',
    url: `https://es.wikipedia.org/w/index.php?search=${enc(q)}`,
    title: `${capitalize(t)} - Wikipedia, la enciclopedia libre`,
    snippet: `Artículo de referencia sobre ${t}: definición, contexto histórico, conceptos relacionados y bibliografía para profundizar.`,
  }),
  (t, q) => ({
    domain: 'scholar.google.com',
    url: `https://scholar.google.com/scholar?q=${enc(q)}`,
    title: `${capitalize(t)}: artículos académicos y citas`,
    snippet: `Estudios, tesis y artículos revisados por pares que abordan ${t} desde distintos enfoques.`,
  }),
  (t, q) => ({
    domain: 'www.britannica.com',
    url: `https://www.britannica.com/search?query=${enc(q)}`,
    title: `${capitalize(t)} | Enciclopedia Británica`,
    snippet: `Entrada enciclopédica con un resumen claro de ${t}, sus antecedentes y su importancia.`,
  }),
  (t, q) => ({
    domain: 'www.khanacademy.org',
    url: `https://es.khanacademy.org/search?page_search_query=${enc(q)}`,
    title: `Aprende sobre ${t} - Khan Academy`,
    snippet: `Lecciones y ejercicios graduales para entender ${t} paso a paso, con explicaciones en video.`,
  }),
  (t, q) => ({
    domain: 'www.coursera.org',
    url: `https://www.coursera.org/search?query=${enc(q)}`,
    title: `Cursos online sobre ${t}`,
    snippet: `Cursos universitarios y especializaciones relacionados con ${t}, impartidos por instituciones educativas.`,
  }),
  (t, q) => ({
    domain: 'www.bbc.com',
    url: `https://www.bbc.com/mundo/search?q=${enc(q)}`,
    title: `${capitalize(t)}: lo que hay que saber - BBC News Mundo`,
    snippet: `Reportajes y explicadores sobre ${t} con contexto y testimonios de especialistas.`,
  }),
];

const NEWS: Template[] = [
  (t, q) => ({
    domain: 'www.bbc.com',
    url: `https://www.bbc.com/mundo/search?q=${enc(q)}`,
    title: `Últimas noticias sobre ${t} - BBC News Mundo`,
    snippet: `Cobertura reciente y análisis de ${t} con corresponsales y expertos.`,
  }),
  (t, q) => ({
    domain: 'elpais.com',
    url: `https://elpais.com/buscador/?q=${enc(q)}`,
    title: `${capitalize(t)}: actualidad y análisis | EL PAÍS`,
    snippet: `Noticias, reportajes y columnas de opinión relacionados con ${t}.`,
  }),
  (t, q) => ({
    domain: 'www.reuters.com',
    url: `https://www.reuters.com/site-search/?query=${enc(q)}`,
    title: `${capitalize(t)} - Reuters`,
    snippet: `Despachos de agencia sobre ${t}, con actualizaciones a medida que avanza la información.`,
  }),
  (t, q) => ({
    domain: 'www.dw.com',
    url: `https://www.dw.com/es/search/?searchTerm=${enc(q)}`,
    title: `${capitalize(t)} - DW Español`,
    snippet: `Cobertura internacional y contexto sobre ${t} desde la mirada de la prensa europea.`,
  }),
  (t, q) => ({
    domain: 'efe.com',
    url: `https://efe.com/buscador/?q=${enc(q)}`,
    title: `Agencia EFE: noticias de ${t}`,
    snippet: `Información de última hora y crónicas relacionadas con ${t}.`,
  }),
  (t, q) => ({
    domain: 'cnnespanol.cnn.com',
    url: `https://cnnespanol.cnn.com/?s=${enc(q)}`,
    title: `${capitalize(t)}: qué se sabe hasta ahora - CNN en Español`,
    snippet: `Resumen de los hechos conocidos y reacciones en torno a ${t}.`,
  }),
];

const FACTCHECK: Template[] = [
  (t, q) => ({
    domain: 'maldita.es',
    url: `https://maldita.es/buscador/?q=${enc(q)}`,
    title: `Qué sabemos sobre ${t} - Maldita.es`,
    snippet: `Análisis de lo que circula sobre ${t}, con las fuentes originales y lo que sí se puede comprobar.`,
  }),
  (t, q) => ({
    domain: 'newtral.es',
    url: `https://www.newtral.es/?s=${enc(q)}`,
    title: `Verificación: ${t} | Newtral`,
    snippet: `Contraste de datos y declaraciones relacionadas con ${t} frente a fuentes oficiales.`,
  }),
  (t, q) => ({
    domain: 'chequeado.com',
    url: `https://chequeado.com/?s=${enc(q)}`,
    title: `${capitalize(t)}: chequeo de datos - Chequeado`,
    snippet: `Revisión de cifras y afirmaciones sobre ${t}, con metodología y fuentes citadas.`,
  }),
  (t, q) => ({
    domain: 'www.reuters.com',
    url: `https://www.reuters.com/fact-check/`,
    title: `Fact Check - Reuters`,
    snippet: `Verificaciones de afirmaciones virales; revisa si el tema ${t} ya fue analizado.`,
  }),
  (t, q) => ({
    domain: 'scholar.google.com',
    url: `https://scholar.google.com/scholar?q=${enc(q)}`,
    title: `${capitalize(t)}: evidencia en artículos académicos`,
    snippet: `Investigaciones revisadas por pares que sirven como fuente primaria sobre ${t}.`,
  }),
  (t, q) => ({
    domain: 'es.wikipedia.org',
    url: `https://es.wikipedia.org/w/index.php?search=${enc(q)}`,
    title: `${capitalize(t)} - Wikipedia, la enciclopedia libre`,
    snippet: `Contexto general sobre ${t} con referencias que puedes consultar directamente.`,
  }),
];

function topicOf(message: string): string {
  let t = message
    .replace(/^\s*(verificar|verifica|fact-?check|comprobar)\s*:?\s*/i, '')
    .replace(/[¿?¡!]/g, '')
    .trim();
  t = t.replace(/^(?:cu[aá]les?|qu[eé]|c[oó]mo|d[oó]nde|cu[aá]ndo|qui[eé]n(?:es)?|por qu[eé])\s+(?:es|son|fue|fueron|hay|significa|se)?\s*/i, '');
  t = t.replace(/^(?:el|la|los|las|un|una)\s+/i, '').trim();
  if (t.length > 70) t = t.slice(0, 70).replace(/\s+\S*$/, '');
  if (!t) return 'el tema consultado';
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/** Search-like answer built from the query itself: coherent result list plus a cautious synthesis. */
export function simulateSearch(message: string, mode: Mode) {
  const topic = topicOf(message);
  const q = message.replace(/^\s*(verificar|verifica)\s*:?\s*/i, '').replace(/[¿?¡!]/g, '').trim() || topic;
  const rng = seededRng(hashString(`${mode}:${message}`));
  const pool = mode === 'news' ? NEWS : mode === 'factcheck' ? FACTCHECK : GENERAL;
  const count = 4 + Math.floor(rng() * 3); // 4-6
  const results = shuffle(pool, rng)
    .slice(0, Math.min(count, pool.length))
    .map((t) => t(topic, q));

  const list = results.map((r) => `- **${r.title}** (${r.domain}): ${r.snippet}`).join('\n');
  let reply: string;
  let verdict: string | null = null;

  if (mode === 'factcheck') {
    verdict = 'EN_DESARROLLO';
    reply = `### Verificación preliminar\n\nSobre «${message.replace(/^\s*verificar\s*:?\s*/i, '').trim()}»: no hay una confirmación única y concluyente en los resultados revisados, así que conviene tratarla con cautela.\n\n**Cómo contrastarla**\n1. Busca el dato original (estudio, comunicado o documento oficial) y comprueba su fecha.\n2. Verifica si medios de verificación independientes ya analizaron esta afirmación.\n3. Distingue entre lo que dice la fuente primaria y lo que repiten las publicaciones virales.\n\n**Dónde revisar**\n${list}\n\nSi encuentras la fuente original, puedes guardarla en tu cuaderno y trabajar con ella.`;
  } else if (mode === 'news') {
    reply = `### Noticias recientes sobre ${topic}\n\nEstos medios publican cobertura relacionada; revisa fecha y autoría antes de citar.\n\n${list}\n\nLos resultados abordan el tema desde el reporte de hechos, el análisis de contexto y la opinión de especialistas. Si quieres, afino la búsqueda con un periodo o una región concreta.`;
  } else {
    reply = `### ${capitalize(topic)}: panorama general\n\nLos resultados más relevantes tratan ${topic} desde tres ángulos: su definición y conceptos básicos, su contexto y evolución, y sus aplicaciones o implicaciones prácticas.\n\n${list}\n\nPuedes abrir cualquiera de las fuentes para profundizar, o guardar esta búsqueda en tu cuaderno para estudiarla junto con tus materiales.`;
  }

  return {
    reply,
    verdict,
    searchQueries: [message.trim(), `${topic} ${mode === 'news' ? 'noticias' : mode === 'factcheck' ? 'verificación' : 'qué es'}`],
    sources: results.map(({title, url, domain}) => ({title, url, domain})),
  };
}
