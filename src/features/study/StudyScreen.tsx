import {Link} from 'react-router';
import {useAppState} from '../../app/AppStateContext';
import {useDailyGoal} from '../progress/dailyGoal';
import {paths, type StudyTab} from '../../app/routes';
import {InlineAlert, Tabs, type NavTabItem} from '../../ui';
import {ActiveRecall} from './ActiveRecall';
import {Flashcards} from './Flashcards';
import {formatClock} from './sessionMachine';
import {SessionRunning} from './SessionRunning';
import {SessionSetup} from './SessionSetup';
import {SessionSummary} from './SessionSummary';
import {useStudySession} from './StudySessionProvider';

const TAB_LABELS: Array<{id: StudyTab; label: string}> = [
  {id: 'sesion', label: 'Sesión'},
  {id: 'repaso', label: 'Repaso activo'},
  {id: 'tarjetas', label: 'Tarjetas'},
];

/** Estudiar section: Sesión · Repaso activo · Tarjetas. */
export function StudyScreen() {
  const {route, activeNotebook, stats, isFocusModeActive} = useAppState();
  const {session, summary} = useStudySession();
  const [dailyGoal] = useDailyGoal();
  if (!activeNotebook) return null;

  const tab: StudyTab = route.kind === 'workspace' && route.studyTab ? route.studyTab : 'sesion';
  const items: NavTabItem[] = TAB_LABELS.map((t) => ({
    id: t.id,
    label: t.label,
    to: paths.studyTab(activeNotebook.id, t.id),
  }));

  return (
    <div className={isFocusModeActive ? 'mx-auto flex w-full flex-col items-center space-y-6 py-4 sm:py-10' : 'space-y-6'}>
      {/* Focus mode hides the notebook header (the usual h1), so the page title takes over. */}
      {isFocusModeActive ? <h1 className="sr-only">Estudiar</h1> : <h2 className="sr-only">Estudiar</h2>}

      {isFocusModeActive ? null : (
        <div className="flex flex-wrap items-stretch justify-between gap-y-1">
          <Tabs items={items} activeId={tab} aria-label="Modos de estudio" className="min-w-0 flex-1" />
          <Link to="/progreso" className="min-h-touch hidden items-center border-b border-rule pl-4 font-mono sm:inline-flex text-label text-primary-text hover:underline">
            Hoy {stats.focusMinutesToday}/{dailyGoal} min → Progreso
          </Link>
        </div>
      )}

      {session && tab !== 'sesion' ? (
        <InlineAlert
          variant="info"
          title="Tienes una sesión en curso"
          actions={
            <Link
              to={paths.studyTab(activeNotebook.id, 'sesion')}
              className="text-label text-primary-text underline-offset-2 hover:underline"
            >
              Volver a la sesión ({formatClock(session.remainingSeconds)})
            </Link>
          }
        >
          El reloj sigue corriendo mientras repasas.
        </InlineAlert>
      ) : null}

      {tab === 'sesion' ? (
        session ? (
          <SessionRunning session={session} />
        ) : summary ? (
          <SessionSummary summary={summary} />
        ) : (
          <SessionSetup />
        )
      ) : null}
      {tab === 'repaso' ? <ActiveRecall /> : null}
      {tab === 'tarjetas' ? <Flashcards /> : null}
    </div>
  );
}
