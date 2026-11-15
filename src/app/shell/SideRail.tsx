import {Link} from 'react-router';
import {AppMark, Icon, resolveItemIcon} from '../../ui';
import {cx} from '../../ui/internal/cx';
import {useAppState} from '../AppStateContext';
import {paths} from '../routes';
import {AccountMenu} from './AccountMenu';
import {activeNavFor, NAV_LINKS} from './nav';
import {TodayChip} from './TodayChip';

const RECENT_COUNT = 5;

/**
 * Desktop (lg+) persistent left rail: brand, section nav, recent notebooks,
 * today chip and account menu. Hidden in Focus mode. Below lg the TopBar and
 * BottomTabBar take over.
 */
export function SideRail() {
  const {route, notebooks, isFocusModeActive} = useAppState();
  if (isFocusModeActive) return null;

  const activeNav = activeNavFor(route);
  const activeNotebookId = route.kind === 'workspace' || route.kind === 'notebookIndex' ? route.notebookId : null;
  // New notebooks are prepended to the list, so the head is the most recent.
  const recent = notebooks.slice(0, RECENT_COUNT);

  return (
    <aside
      aria-label="Navegación lateral"
      className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-rule bg-surface px-4 py-6 lg:flex"
    >
      <Link
        to={paths.notebooks()}
        aria-label="MIA, ir a Biblioteca"
        className="inline-flex items-center gap-2 self-start rounded-small px-2 font-display text-h1 font-medium tracking-tight text-strong"
      >
        <AppMark size={28} />
        <span>MIA</span>
      </Link>

      <nav aria-label="Principal">
        <ul className="flex flex-col gap-1">
          {NAV_LINKS.map((l) => {
            const active = activeNav === l.id;
            return (
              <li key={l.id}>
                <Link
                  to={l.to}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'flex h-10 items-center gap-3 rounded-control px-3 text-label transition-colors duration-[120ms]',
                    active
                      ? 'bg-subtle font-semibold text-strong shadow-[inset_3px_0_0_var(--mia-highlight)]'
                      : 'font-medium text-muted hover:bg-subtle hover:text-strong',
                  )}
                >
                  <Icon name={l.icon} weight={active ? 'fill' : 'regular'} className="size-5" />
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {recent.length > 0 ? (
        <nav aria-label="Cuadernos recientes" className="min-h-0 flex-1 overflow-y-auto">
          <p className="px-3 pb-2 font-mono text-caption uppercase tracking-widest text-muted">Recientes</p>
          <ul className="flex flex-col gap-0.5">
            {recent.map((nb) => {
              const active = nb.id === activeNotebookId;
              return (
                <li key={nb.id}>
                  <Link
                    to={paths.notebookSegment(nb.id, 'CHAT')}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'flex h-9 items-center gap-3 rounded-control px-3 text-small transition-colors duration-[120ms]',
                      active ? 'bg-subtle font-semibold text-strong' : 'text-default hover:bg-subtle',
                    )}
                  >
                    <Icon name={resolveItemIcon(nb.icon, 'notebook')} weight="duotone" className="size-4 shrink-0 text-muted" />
                    <span className="truncate">{nb.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex flex-col gap-3 border-t border-rule pt-4">
        <TodayChip />
        <AccountMenu variant="rail" />
      </div>
    </aside>
  );
}
