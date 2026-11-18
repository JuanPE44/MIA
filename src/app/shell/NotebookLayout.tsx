import {useState, type ReactNode} from 'react';
import {BottomTabBar, Page, PageTransition, Tabs, type NavTabItem} from '../../ui';
import {useIsPhone} from '../../ui/internal/useIsPhone';
import {useAppState} from '../AppStateContext';
import {paths, SEGMENT_SLUGS} from '../routes';
import type {MainSegment} from '../../types';
import {AddSourceDialog} from '../../features/sources';
import {NotebookHeader} from './NotebookHeader';
import {TabActionsContext} from './TabActionsSlot';
import {Icon} from '../../ui/Icon';

/** Verb labels; `phoneLabel` is the shorter text for the bottom bar. */
const SECTIONS: Array<{segment: MainSegment; label: string; phoneLabel?: string; icon: ReactNode}> = [
  {segment: 'CHAT', label: 'Preguntar', icon: <Icon name="chat" />},
  {segment: 'FUENTES', label: 'Fuentes', icon: <Icon name="document" />},
  {segment: 'ARTEFACTOS', label: 'Crear material', phoneLabel: 'Crear', icon: <Icon name="materials" />},
  {segment: 'ESTUDIO', label: 'Estudiar', icon: <Icon name="timer" />},
];

/**
 * Notebook shell: header + section Tabs (>= 640 px) or BottomTabBar (< 640 px)
 * around the active section. In Focus mode only the content renders.
 */
export function NotebookLayout({children}: {children: ReactNode}) {
  const phone = useIsPhone();
  const {activeNotebook, activeSegment, isFocusModeActive, isAddSourceOpen, closeAddSource} = useAppState();
  const [actionsNode, setActionsNode] = useState<HTMLElement | null>(null);

  if (!activeNotebook) return <>{children}</>;
  if (isFocusModeActive) return <Page>{children}</Page>;

  // Desktop tabs are text only; a muted "0" hints that Fuentes is still empty.
  const tabs: NavTabItem[] = SECTIONS.map((s) => ({
    id: SEGMENT_SLUGS[s.segment],
    label: s.label,
    to: paths.notebookSegment(activeNotebook.id, s.segment),
    count: s.segment === 'FUENTES' && activeNotebook.sources.length === 0 ? 0 : undefined,
  }));
  const phoneTabs = SECTIONS.map((s) => ({
    id: SEGMENT_SLUGS[s.segment],
    label: s.phoneLabel ?? s.label,
    to: paths.notebookSegment(activeNotebook.id, s.segment),
    icon: s.icon,
  }));
  const activeId = SEGMENT_SLUGS[activeSegment];

  return (
    <Page className="flex flex-col gap-4">
      <div>
        <NotebookHeader />
        {!phone ? (
          <div className="flex items-center gap-2 border-b border-rule">
            <Tabs
              aria-label="Secciones del cuaderno"
              items={tabs}
              activeId={activeId}
              className="min-w-0 flex-1 border-b-0!"
            />
            <div ref={setActionsNode} className="flex shrink-0 items-center gap-1" />
          </div>
        ) : null}
      </div>
      <TabActionsContext.Provider value={phone ? null : actionsNode}>
        <PageTransition transitionKey={activeId}>{children}</PageTransition>
      </TabActionsContext.Provider>
      <AddSourceDialog open={isAddSourceOpen} onClose={closeAddSource} />
      {phone ? (
        <BottomTabBar
          aria-label="Secciones del cuaderno"
          items={phoneTabs}
          activeId={activeId}
        />
      ) : null}
    </Page>
  );
}
