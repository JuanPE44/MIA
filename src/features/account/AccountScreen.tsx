import {Settings, User} from 'lucide-react';
import {Tabs, type NavTabItem} from '../../ui';
import {PreferencesPanel} from './PreferencesPanel';
import {ProfilePanel} from './ProfilePanel';

export type AccountTab = 'perfil' | 'preferencias';

const ITEMS: NavTabItem[] = [
  {id: 'perfil', label: 'Perfil', to: '/cuenta/perfil', icon: <User />},
  {id: 'preferencias', label: 'Preferencias', to: '/cuenta/preferencias', icon: <Settings />},
];

/** "Cuenta" (S11): Perfil and Preferencias as URL-addressable tabs. No plan labels (UX-28). */
export function AccountScreen({tab}: {tab: AccountTab}) {
  return (
    <div className="mx-auto max-w-[640px] space-y-6">
      <h1 className="text-h1 text-strong">Cuenta</h1>
      <Tabs items={ITEMS} activeId={tab} aria-label="Secciones de la cuenta" />
      {tab === 'perfil' ? <ProfilePanel /> : <PreferencesPanel />}
    </div>
  );
}
