import {Link, useNavigate} from 'react-router';
import {BarChart3, Check, HelpCircle, LogOut, Monitor, Moon, Settings, Sun, User} from 'lucide-react';
import {Avatar, Menu, type MenuItem} from '../../ui';
import {cx} from '../../ui/internal/cx';
import {useIsPhone} from '../../ui/internal/useIsPhone';
import {useAppState} from '../AppStateContext';
import {useTheme, type ThemeMode} from '../providers/ThemeProvider';
import {paths} from '../routes';
import {SHELL_PATHS} from './paths';
import {TodayChip} from './TodayChip';

type NavId = 'notebooks' | 'progress' | 'help';

/** 56 px global bar: logo, section links, TodayChip, account menu. Hidden in Focus mode. */
export function TopBar() {
  const navigate = useNavigate();
  const phone = useIsPhone();
  const {route, currentUser, studentProfile, handleLogout, isFocusModeActive} = useAppState();
  const {mode, setMode} = useTheme();

  if (isFocusModeActive) return null;

  const activeNav: NavId | null =
    route.kind === 'explorer' || route.kind === 'workspace' || route.kind === 'notebookIndex'
      ? 'notebooks'
      : route.kind === 'progreso'
        ? 'progress'
        : route.kind === 'ayuda'
          ? 'help'
          : null;

  const links: Array<{id: NavId; label: string; to: string}> = [
    {id: 'notebooks', label: 'Mis cuadernos', to: paths.notebooks()},
    {id: 'progress', label: 'Progreso', to: SHELL_PATHS.progress},
    {id: 'help', label: 'Ayuda', to: SHELL_PATHS.help},
  ];

  const name = studentProfile?.name?.trim() || currentUser || 'Estudiante';

  const themeItem = (value: ThemeMode, label: string, icon: React.ReactNode, first = false): MenuItem => ({
    id: `theme-${value}`,
    label,
    icon: mode === value ? <Check aria-hidden /> : icon,
    onSelect: () => setMode(value),
    dividerBefore: first,
  });

  const items: MenuItem[] = [
    {id: 'profile', label: 'Perfil', icon: <User />, onSelect: () => navigate(SHELL_PATHS.profile)},
    {id: 'prefs', label: 'Preferencias', icon: <Settings />, onSelect: () => navigate(SHELL_PATHS.preferences)},
    ...(phone
      ? [
          {id: 'progress', label: 'Progreso', icon: <BarChart3 />, onSelect: () => navigate(SHELL_PATHS.progress), dividerBefore: true},
          {id: 'help', label: 'Ayuda', icon: <HelpCircle />, onSelect: () => navigate(SHELL_PATHS.help)},
        ]
      : []),
    themeItem('light', 'Tema claro', <Sun />, true),
    themeItem('dark', 'Tema oscuro', <Moon />),
    themeItem('system', 'Tema del sistema', <Monitor />),
    {id: 'logout', label: 'Cerrar sesión', icon: <LogOut />, onSelect: handleLogout, dividerBefore: true},
  ];

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-hairline bg-surface">
      <div className="mx-auto flex h-full w-full max-w-content items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to={paths.notebooks()}
          aria-label="MIA, ir a Mis cuadernos"
          className="rounded-small text-h2 font-semibold tracking-tight text-strong"
        >
          MIA
        </Link>

        <nav aria-label="Principal" className="hidden h-full sm:block">
          <ul className="flex h-full items-center gap-2">
            {links.map((l) => {
              const active = activeNav === l.id;
              return (
                <li key={l.id} className="h-full">
                  <Link
                    to={l.to}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'relative inline-flex h-full items-center px-3 text-label transition-colors duration-[120ms]',
                      active ? 'font-semibold text-primary-text' : 'font-medium text-muted hover:text-strong',
                    )}
                  >
                    {l.label}
                    {active ? <span aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <TodayChip />
          <Menu
            label="Cuenta"
            items={items}
            header={
              <p className="truncate text-label font-semibold text-strong" title={name}>
                {name}
              </p>
            }
            renderTrigger={(triggerProps) => (
              <button
                {...triggerProps}
                type="button"
                aria-label={`Cuenta de ${name}`}
                className="relative inline-flex rounded-pill transition-opacity duration-[120ms] hover:opacity-80 pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 pointer-coarse:after:content-['']"
              >
                <Avatar name={name} size={32} />
              </button>
            )}
          />
        </div>
      </div>
    </header>
  );
}
