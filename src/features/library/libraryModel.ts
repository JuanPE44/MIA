import type {Folder, Notebook} from '../../types';
import {FOLDER_ICON_KEYS, NOTEBOOK_ICON_KEYS} from '../../ui/Icon';
import bannerEmprendimiento from '../../assets/images/folder_emprendimiento_banner_1791726610840.jpg';
import bannerCuatrimestre from '../../assets/images/folder_cuatrimestre_banner_1791726628989.jpg';

/** Icon registry keys (see src/ui/Icon); legacy emoji are resolved at read time. */
export const FOLDER_ICONS = FOLDER_ICON_KEYS;
export const NOTEBOOK_ICONS = NOTEBOOK_ICON_KEYS;

/** Existing banner images a folder can use as cover (same assets as the legacy flow). */
export const FOLDER_COVERS = [
  {id: 'emprendimiento', label: 'Emprendimiento', src: bannerEmprendimiento},
  {id: 'cuatrimestre', label: 'Cuatrimestre', src: bannerCuatrimestre},
] as const;

/** `?carpeta=` value for notebooks without a folder. */
export const LOOSE_FILTER = 'sin-carpeta';

const TILES = ['azul', 'durazno', 'lima', 'rosa', 'violeta', 'gris'] as const;
// Literal class names so Tailwind can see them.
const TILE_CLASS: Record<(typeof TILES)[number], string> = {
  azul: 'bg-tile-azul',
  durazno: 'bg-tile-durazno',
  lima: 'bg-tile-lima',
  rosa: 'bg-tile-rosa',
  violeta: 'bg-tile-violeta',
  gris: 'bg-tile-gris',
};

/** Stable accent tile per notebook (derived from id; no persisted field needed). */
export function tileClassFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TILE_CLASS[TILES[hash % TILES.length]];
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const countLabels = {
  notebooks: (n: number) => plural(n, 'cuaderno', 'cuadernos'),
  folders: (n: number) => plural(n, 'carpeta', 'carpetas'),
  sources: (n: number) => plural(n, 'fuente', 'fuentes'),
};

export function isLoose(nb: Notebook, folders: Folder[]): boolean {
  return !nb.folderId || !folders.some((f) => f.id === nb.folderId);
}

export function matchesQuery(nb: Notebook, folder: Folder | undefined, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    nb.title.toLowerCase().includes(q) ||
    nb.subject.toLowerCase().includes(q) ||
    nb.description.toLowerCase().includes(q) ||
    Boolean(folder?.name.toLowerCase().includes(q))
  );
}
