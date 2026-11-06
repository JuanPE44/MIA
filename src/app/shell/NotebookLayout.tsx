import type {ReactNode} from 'react';
import {FileText, Layers, MessageSquare, Timer} from 'lucide-react';
import {BottomTabBar, Tabs, type NavTabItem} from '../../ui';
import {useIsPhone} from '../../ui/internal/useIsPhone';
import {useAppState} from '../AppStateContext';
import {paths, SEGMENT_SLUGS} from '../routes';
import type {MainSegment} from '../../types';
import {AddSourceDialog} from '../../features/sources';
import {NotebookHeader} from './NotebookHeader';

const SECTIONS: Array<{segment: MainSegment; label: string; icon: ReactNode}> = [
  {segment: 'CHAT', label: 'Chat', icon: <MessageSquare />},
  {segment: 'FUENTES', label: 'Fuentes', icon: <FileText />},
  {segment: 'ARTEFACTOS', label: 'Materiales', icon: <Layers />},
  {segment: 'ESTUDIO', label: 'Estudiar', icon: <Timer />},
];

/**
 * Notebook shell: header + section Tabs (>= 640 px) or BottomTabBar (< 640 px)
 * around the active section. In Focus mode only the content renders.
 */
export function NotebookLayout({children}: {children: ReactNode}) {
  const phone = useIsPhone();
  const {activeNotebook, activeSegment, currentThreads, isFocusModeActive, isAddSourceOpen, closeAddSource} =
    useAppState();

  if (!activeNotebook || isFocusModeActive) return <>{children}</>;

  const counts: Partial<Record<MainSegment, number>> = {
    CHAT: currentThreads.length > 1 ? currentThreads.length : undefined,
    FUENTES: activeNotebook.sources.length,
    ARTEFACTOS: activeNotebook.artifacts.length,
  };
  const tabs: NavTabItem[] = SECTIONS.map((s) => ({
    id: SEGMENT_SLUGS[s.segment],
    label: s.label,
    to: paths.notebookSegment(activeNotebook.id, s.segment),
    icon: s.icon,
    count: counts[s.segment],
  }));
  const activeId = SEGMENT_SLUGS[activeSegment];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <NotebookHeader />
        {!phone ? <Tabs aria-label="Secciones del cuaderno" items={tabs} activeId={activeId} /> : null}
      </div>
      {children}
      <AddSourceDialog open={isAddSourceOpen} onClose={closeAddSource} />
      {phone ? (
        <BottomTabBar
          aria-label="Secciones del cuaderno"
          items={tabs.map(({id, label, to, icon}) => ({id, label, to, icon: icon as ReactNode}))}
          activeId={activeId}
        />
      ) : null}
    </div>
  );
}
