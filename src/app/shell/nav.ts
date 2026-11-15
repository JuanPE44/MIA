import type {IconName} from '../../ui';
import {paths} from '../routes';
import {SHELL_PATHS} from './paths';
import type {AppRoute} from '../routes';

export type NavId = 'notebooks' | 'progress' | 'help';

export const NAV_LINKS: Array<{id: NavId; label: string; to: string; icon: IconName}> = [
  {id: 'notebooks', label: 'Biblioteca', to: paths.notebooks(), icon: 'notebook'},
  {id: 'progress', label: 'Progreso', to: SHELL_PATHS.progress, icon: 'progress'},
  {id: 'help', label: 'Ayuda', to: SHELL_PATHS.help, icon: 'help'},
];

/** Which top-level section the current route belongs to. */
export function activeNavFor(route: Pick<AppRoute, 'kind'>): NavId | null {
  switch (route.kind) {
    case 'explorer':
    case 'workspace':
    case 'notebookIndex':
      return 'notebooks';
    case 'progreso':
      return 'progress';
    case 'ayuda':
      return 'help';
    default:
      return null;
  }
}
