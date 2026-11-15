import {Link} from 'react-router';
import {useAppState} from '../AppStateContext';
import {paths} from '../routes';
import {AppMark} from '../../ui';
import {cx} from '../../ui/internal/cx';
import {AccountMenu} from './AccountMenu';
import {activeNavFor, NAV_LINKS} from './nav';
import {TodayChip} from './TodayChip';

/**
 * Slim 56 px bar for phone and tablet (< lg): logo, section links (sm+),
 * TodayChip, account menu. On lg+ the SideRail replaces it. Hidden in Focus mode.
 */
export function TopBar() {
  const {route, isFocusModeActive} = useAppState();
  if (isFocusModeActive) return null;
  const activeNav = activeNavFor(route);

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-rule bg-surface lg:hidden">
      <div className="flex h-full w-full max-w-content items-center gap-4 px-4 sm:px-6">
        <Link
          to={paths.notebooks()}
          aria-label="MIA, ir a Biblioteca"
          className="inline-flex items-center gap-2 rounded-small font-display text-h2 font-medium tracking-tight text-strong"
        >
          <AppMark size={22} />
          <span>MIA</span>
        </Link>

        <nav aria-label="Principal" className="hidden h-full sm:block">
          <ul className="flex h-full items-center gap-2">
            {NAV_LINKS.map((l) => {
              const active = activeNav === l.id;
              return (
                <li key={l.id} className="h-full">
                  <Link
                    to={l.to}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'relative inline-flex h-full items-center px-3 text-label transition-colors duration-[120ms]',
                      active ? 'font-semibold text-strong' : 'font-medium text-muted hover:text-strong',
                    )}
                  >
                    {l.label}
                    {active ? <span aria-hidden className="absolute inset-x-3 bottom-0 h-1.5 border-b-2 border-ink bg-highlight" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <TodayChip compact />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
