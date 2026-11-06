import type {SourceItem} from '../../types';

export type SearchMode = 'general' | 'news' | 'factcheck';

export interface GroundedSource {
  title: string;
  url: string;
  domain: string;
}

export type Verdict = 'VERIFICADO_VERDADERO' | 'PARCIALMENTE_CIERTO' | 'FALSO_DESMENTIDO' | 'EN_DESARROLLO';

export interface SearchTurn {
  id: string;
  query: string;
  mode: SearchMode;
  status: 'loading' | 'done' | 'error';
  reply?: string;
  verdict?: Verdict | null;
  sources?: GroundedSource[];
  verifiedAt?: string;
}

export const MODE_OPTIONS: Array<{value: SearchMode; label: string; placeholder: string}> = [
  {value: 'general', label: 'Actualidad', placeholder: 'Pregunta por un tema o suceso actual'},
  {value: 'news', label: 'Noticias con citas', placeholder: 'Pide noticias recientes sobre un tema'},
  {value: 'factcheck', label: 'Verificar un dato', placeholder: 'Escribe la afirmación que quieres verificar'},
];

export const SUGGESTIONS: Record<SearchMode, string[]> = {
  general: [
    '¿Cuáles son los avances más recientes en inteligencia artificial?',
    'Novedades y tendencias en metodologías de estudio universitario',
  ],
  news: [
    'Principales noticias tecnológicas y científicas de esta semana',
    '¿Qué informan los medios hoy sobre energías renovables?',
  ],
  factcheck: [
    'Verificar: ¿la jornada laboral de 4 días redujo el estrés en Europa?',
    'Verificar: ¿el telescopio James Webb detectó señales biológicas?',
  ],
};

export const VERDICT_LABEL: Record<Verdict, {label: string; variant: 'success' | 'warning' | 'danger' | 'info'}> = {
  VERIFICADO_VERDADERO: {label: 'Verificado', variant: 'success'},
  PARCIALMENTE_CIERTO: {label: 'Parcialmente cierto', variant: 'warning'},
  FALSO_DESMENTIDO: {label: 'Falso', variant: 'danger'},
  EN_DESARROLLO: {label: 'En desarrollo', variant: 'info'},
};

/** Same request as the legacy agent: POST /api/search-grounding. */
export async function searchGrounding(
  message: string,
  mode: SearchMode,
  previous: SearchTurn[],
): Promise<Pick<SearchTurn, 'reply' | 'verdict' | 'sources' | 'verifiedAt'>> {
  const history = previous
    .filter((t) => t.status === 'done' && t.reply)
    .flatMap((t) => [
      {role: 'user', text: t.query},
      {role: 'model', text: t.reply as string},
    ])
    .slice(-8);
  const res = await fetch('/api/search-grounding', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message, history, mode}),
  });
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  const data = await res.json();
  return {
    reply: data.reply || 'No se obtuvo respuesta de la búsqueda.',
    verdict: data.verdict || null,
    sources: data.sources || [],
    verifiedAt: data.verifiedAt,
  };
}

/** Builds the payload for handleSaveSearchSource from a finished turn. */
export function turnToSource(turn: SearchTurn): Partial<SourceItem> {
  const sources = turn.sources ?? [];
  const reply = turn.reply ?? '';
  const cited = sources.length
    ? `\n\nFuentes citadas:\n${sources.map((s) => `- ${s.title} (${s.url})`).join('\n')}`
    : '';
  const content = `RESULTADO DE BÚSQUEDA EN LA WEB\n\nConsulta: ${turn.query}\nFecha de consulta: ${new Date().toLocaleString('es-ES')}\n\n${reply}${cited}`;
  const title = turn.query.length > 70 ? `${turn.query.slice(0, 67)}…` : turn.query;
  return {
    type: sources.length ? 'link' : 'text',
    title,
    sourceUrl: sources[0]?.url,
    content,
    wordCount: content.split(/\s+/).filter(Boolean).length,
  };
}
