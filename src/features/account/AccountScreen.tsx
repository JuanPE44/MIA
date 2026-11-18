import {Highlight, Page, PageHeader, Tabs, type NavTabItem} from '../../ui';
import {PreferencesPanel} from './PreferencesPanel';
import {PlanPanel} from './PlanPanel';
import {ProfilePanel} from './ProfilePanel';
import {Icon} from '../../ui/Icon';

export type AccountTab = 'perfil' | 'preferencias';

const ITEMS: NavTabItem[] = [
  {id: 'perfil', label: 'Perfil', to: '/cuenta/perfil', icon: <Icon name="user" />},
  {id: 'preferencias', label: 'Preferencias', to: '/cuenta/preferencias', icon: <Icon name="settings" />},
];

/** "Cuenta" (S11): Perfil and Preferencias as URL-addressable tabs. Perfil also shows the current plan. */
export function AccountScreen({tab}: {tab: AccountTab}) {
  return (
    <Page className="space-y-6">
      <PageHeader title={<Highlight trigger="mount">Cuenta</Highlight>} />
      <Tabs items={ITEMS} activeId={tab} aria-label="Secciones de la cuenta" />
      <div className="max-w-3xl">{tab === 'perfil' ? (
          <div className="space-y-6">
            <ProfilePanel />
            <PlanPanel />
          </div>
        ) : (
          <PreferencesPanel />
        )}</div>
    </Page>
  );
}
