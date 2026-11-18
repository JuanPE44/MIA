import type {IconName} from '../../ui/Icon';
import type {ArtifactPersonalization, ArtifactType, StudyArtifact} from '../../types';

export interface MaterialTypeInfo {
  id: ArtifactType;
  /** Name shown in tiles, cards and headings (glossary, IA §7). */
  label: string;
  /** Lowercase noun for sentences: "Crear <noun>". */
  noun: string;
  description: string;
  icon: IconName;
  /** CSS gradient token for the "Crear material" tile band. */
  gradient: string;
}

/** The 8 material types, in the order of the legacy buttons. */
export const MATERIAL_TYPES: MaterialTypeInfo[] = [
  {id: 'resumen', label: 'Resumen', noun: 'resumen', description: 'Las ideas clave, condensadas', icon: 'document', gradient: 'var(--mia-grad-amber)'},
  {id: 'cuestionario', label: 'Cuestionario', noun: 'cuestionario', description: 'Preguntas con soluciones', icon: 'help', gradient: 'var(--mia-grad-lime)'},
  {id: 'flashcards', label: 'Tarjetas', noun: 'tarjetas', description: 'Tarjetas de memoria para repasar', icon: 'materials', gradient: 'var(--mia-grad-blue)'},
  {id: 'guia', label: 'Guía', noun: 'guía', description: 'Hoja de ruta paso a paso', icon: 'book', gradient: 'var(--mia-grad-violet)'},
  {id: 'modelo_examen', label: 'Modelo de examen', noun: 'modelo de examen', description: 'Un simulacro de prueba', icon: 'award', gradient: 'var(--mia-grad-coral)'},
  {id: 'audio_podcast', label: 'Audio', noun: 'audio', description: 'Un podcast para escuchar', icon: 'headphones', gradient: 'var(--mia-grad-magenta)'},
  {id: 'infografia', label: 'Infografía', noun: 'infografía', description: 'Esquema visual con pilares', icon: 'sparkles', gradient: 'var(--mia-grad-teal)'},
  {id: 'presentacion', label: 'Presentación', noun: 'presentación', description: 'Diapositivas con los conceptos', icon: 'presentation', gradient: 'var(--mia-grad-cyan)'},
];

export const materialTypeOf = (type: ArtifactType): MaterialTypeInfo =>
  MATERIAL_TYPES.find((t) => t.id === type) ?? MATERIAL_TYPES[0];

// --- Personalization options (every legacy option; UX-26) -----------------

export const QUALITY_OPTIONS: Array<{value: ArtifactPersonalization['quality']; label: string}> = [
  {value: 'bajo', label: 'Bajo'},
  {value: 'medio', label: 'Medio'},
  {value: 'alto', label: 'Alto'},
  {value: 'detallista', label: 'Detallista'},
];

export const FORMAT_OPTIONS: Array<{value: ArtifactPersonalization['format']; label: string}> = [
  {value: 'texto', label: 'Texto'},
  {value: 'punteo', label: 'Punteo'},
  {value: 'brainstorming', label: 'Brainstorming'},
  {value: 'jerarquico', label: 'Jerárquico'},
];

export const LENGTH_OPTIONS: Array<{value: ArtifactPersonalization['length']; label: string}> = [
  {value: 'conciso', label: 'Conciso'},
  {value: 'intermedio', label: 'Intermedio'},
  {value: 'detallado', label: 'Detallado'},
];

/**
 * Author highlight colors. Marker-style pastel fills with dark text work on
 * both themes (like a real highlighter), so they are fixed `oklch` values
 * rather than theme tokens.
 */
export const AUTHOR_COLORS: Array<{id: string; label: string; bg: string}> = [
  {id: 'amber', label: 'Amarillo', bg: 'oklch(0.93 0.15 100)'},
  {id: 'purple', label: 'Violeta', bg: 'oklch(0.85 0.09 305)'},
  {id: 'sky', label: 'Celeste', bg: 'oklch(0.86 0.08 230)'},
  {id: 'emerald', label: 'Verde', bg: 'oklch(0.88 0.12 155)'},
  {id: 'pink', label: 'Rosa', bg: 'oklch(0.86 0.09 350)'},
  {id: 'orange', label: 'Naranja', bg: 'oklch(0.86 0.11 65)'},
];

export const MARK_TEXT_COLOR = 'oklch(0.25 0.02 260)';

export const highlightColorOf = (id?: string) =>
  AUTHOR_COLORS.find((c) => c.id === id) ?? AUTHOR_COLORS[0];

/** Same defaults as the legacy configuration modal. */
export const DEFAULT_PERSONALIZATION: ArtifactPersonalization = {
  quality: 'alto',
  format: 'jerarquico',
  length: 'intermedio',
  citeSources: true,
  keepTitles: true,
  highlightAuthors: true,
  authorHighlightColor: 'amber',
  addExamples: true,
  generateGraphics: true,
  generateIndex: true,
};

// --- Remembered options per type (new key; existing shapes untouched) -----

const PREFS_KEY = 'mia_material_prefs_v1';

type PrefsMap = Partial<Record<ArtifactType, Partial<ArtifactPersonalization>>>;

function readPrefs(): PrefsMap {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as PrefsMap) : {};
  } catch {
    return {};
  }
}

/** Last-used options for a type merged over the defaults. */
export function loadPersonalization(type: ArtifactType): ArtifactPersonalization {
  return {...DEFAULT_PERSONALIZATION, ...readPrefs()[type]};
}

export function savePersonalization(type: ArtifactType, value: ArtifactPersonalization): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({...readPrefs(), [type]: value}));
  } catch {
    // Private mode / blocked storage: options simply are not remembered.
  }
}

// --- Artifact helpers -----------------------------------------------------

/** Types that have an interactive renderer and the data it needs. */
export function hasInteractiveMode(artifact: StudyArtifact): boolean {
  const data = artifact.structuredData;
  if (!data) return false;
  switch (artifact.type) {
    case 'cuestionario':
    case 'flashcards':
    case 'audio_podcast':
      return Array.isArray(data);
    case 'infografia':
      return typeof data === 'object';
    default:
      return false;
  }
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
