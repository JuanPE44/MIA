import {useNavigate} from 'react-router';
import type {ReactNode} from 'react';
import {Avatar, Icon, Menu, type MenuItem} from '../../ui';
import {cx} from '../../ui/internal/cx';
import {useIsPhone} from '../../ui/internal/useIsPhone';
import {useAppState} from '../AppStateContext';
import {useTheme, type ThemeMode} from '../providers/ThemeProvider';
import {SHELL_PATHS} from './paths';

interface AccountMenuProps {
  /** `rail` renders a full-width row with the name; `avatar` just the avatar button. */
  variant?: 'avatar' | 'rail';
}

/** Account menu (profile, preferences, theme, logout) shared by TopBar and SideRail. */
export function AccountMenu({variant = 'avatar'}: AccountMenuProps) {
  const navigate = useNavigate();
  const phone = useIsPhone();
  const {currentUser, studentProfile, handleLogout} = useAppState();
  const {mode, setMode} = useTheme();
  const name = studentProfile?.name?.trim() || currentUser || 'Estudiante';

  const themeItem = (value: ThemeMode, label: string, icon: ReactNode, first = false): MenuItem => ({
    id: `theme-${value}`,
    label,
    icon: mode === value ? <Icon name="check" weight="bold" /> : icon,
    onSelect: () => setMode(value),
    dividerBefore: first,
  });

  const items: MenuItem[] = [
    {id: 'profile', label: 'Perfil', icon: <Icon name="user" />, onSelect: () => navigate(SHELL_PATHS.profile)},
    {id: 'prefs', label: 'Preferencias', icon: <Icon name="settings" />, onSelect: () => navigate(SHELL_PATHS.preferences)},
    ...(phone
      ? [
          {id: 'progress', label: 'Progreso', icon: <Icon name="progress" />, onSelect: () => navigate(SHELL_PATHS.progress), dividerBefore: true},
          {id: 'help', label: 'Ayuda', icon: <Icon name="help" />, onSelect: () => navigate(SHELL_PATHS.help)},
        ]
      : []),
    themeItem('light', 'Tema claro', <Icon name="theme-light" />, true),
    themeItem('dark', 'Tema oscuro', <Icon name="theme-dark" />),
    themeItem('system', 'Tema del sistema', <Icon name="theme-system" />),
    {id: 'logout', label: 'Cerrar sesión', icon: <Icon name="logout" />, onSelect: handleLogout, dividerBefore: true},
  ];

  return (
    <Menu
      label="Cuenta"
      items={items}
      header={
        <p className="truncate text-label font-semibold text-strong" title={name}>
          {name}
        </p>
      }
      renderTrigger={(triggerProps) =>
        variant === 'rail' ? (
          <button
            {...triggerProps}
            type="button"
            aria-label={`Cuenta de ${name}`}
            className="flex w-full items-center gap-3 rounded-control border border-transparent px-2 py-2 text-left transition-colors duration-[120ms] hover:border-rule hover:bg-subtle"
          >
            <Avatar name={name} size={32} />
            <span className="min-w-0 flex-1 truncate text-label font-medium text-strong">{name}</span>
            <Icon name="chevron-right" className="size-4 text-muted" />
          </button>
        ) : (
          <button
            {...triggerProps}
            type="button"
            aria-label={`Cuenta de ${name}`}
            className={cx(
              'relative inline-flex rounded-pill transition-opacity duration-[120ms] hover:opacity-80',
              "pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 pointer-coarse:after:content-['']",
            )}
          >
            <Avatar name={name} size={32} />
          </button>
        )
      }
    />
  );
}
