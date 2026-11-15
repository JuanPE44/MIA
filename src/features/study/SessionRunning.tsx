import {useEffect, useRef, useState} from 'react';
import {useAppState} from '../../app/AppStateContext';
import {Button, Card, ConfirmDialog, Dialog, InlineAlert, SimulatedBadge, Spinner, StatusBadge} from '../../ui';
import {buildStages, currentStage, type SessionState, type Stage} from './sessionMachine';
import {requestChallenge, type RecallChallenge} from './recallApi';
import {useStudySession, type LeaveReason} from './StudySessionProvider';
import {TimerRing} from './TimerRing';
import {Icon} from '../../ui/Icon';

function stageLabel(stage: Stage, cycles: number): string {
  if (stage.type === 'study') return `Estudio · ${stage.block} de ${cycles}`;
  return stage.type === 'short' ? 'Descanso corto' : 'Descanso largo';
}

/** S7b: the running session. */
export function SessionRunning({session}: {session: SessionState}) {
  const {
    blindadoOn, fullscreenUnsupported, tabLeaves, leaveReason, tabLeftOpen, dismissTabLeft,
    debug, dispatch, finish, exitBlindado,
  } = useStudySession();
  const [confirmEnd, setConfirmEnd] = useState(false);

  const stage = currentStage(session);
  const stages = buildStages(session.config);
  const between = session.status === 'between';
  const paused = session.status === 'paused';
  const isBreak = stage.type !== 'study';

  const primaryLabel = between ? (isBreak ? 'Empezar descanso' : 'Empezar bloque de estudio') : paused ? 'Reanudar' : 'Pausar';
  const onPrimary = () => dispatch({type: session.status === 'running' ? 'pause' : 'resume'});

  // Move focus to the stage heading when the stage changes so keyboard/AT users land on it.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStage = useRef(true);
  useEffect(() => {
    if (firstStage.current) {
      firstStage.current = false;
      return;
    }
    headingRef.current?.focus({preventScroll: true});
  }, [session.stageIndex]);

  return (
    <section
      aria-label="Sesión en curso"
      data-theme="dark"
      className="mx-auto w-full max-w-narrow space-y-6 rounded-card border border-rule bg-page p-5 text-default sm:p-8 [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,var(--mia-rule)_31px,var(--mia-rule)_32px)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {blindadoOn ? (
          <StatusBadge variant="success">
            <Icon name="shield-check" className="size-4" /> Modo blindado: activado
          </StatusBadge>
        ) : (
          <StatusBadge variant="neutral">
            <Icon name="shield-off" className="size-4" /> Modo blindado: desactivado
          </StatusBadge>
        )}
        {blindadoOn ? (
          <Button variant="secondary" size="sm" leadingIcon={<Icon name="logout" className="size-4" />} onClick={exitBlindado}>
            Salir del modo blindado
          </Button>
        ) : null}
      </div>

      {fullscreenUnsupported && blindadoOn ? (
        <InlineAlert variant="info" live>
          Tu navegador no permite pantalla completa; igual te avisaremos si cambias de pestaña.
        </InlineAlert>
      ) : null}

      {blindadoOn ? (
        <p className="font-mono text-small text-muted">
          Salidas de la sesión: <span className="tabular-nums text-strong">{tabLeaves}</span>
        </p>
      ) : null}

      <div className="space-y-4 text-center">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-h1 text-strong outline-none">
          {stageLabel(stage, session.config.cycles)}
        </h2>
        {between ? <p className="text-small text-muted">Etapa lista para empezar.</p> : null}
        {paused ? <p className="text-small text-muted">En pausa.</p> : null}
        <TimerRing
          remainingSeconds={session.remainingSeconds}
          totalSeconds={stage.minutes * 60}
          tone={isBreak ? 'break' : 'study'}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto sm:min-w-44"
            leadingIcon={between || paused ? <Icon name="play" className="size-5" /> : <Icon name="pause" className="size-5" />}
            onClick={onPrimary}
          >
            {primaryLabel}
          </Button>
          <Button size="lg" variant="secondary" className="w-full sm:w-auto" onClick={() => setConfirmEnd(true)}>
            Terminar
          </Button>
        </div>
        {debug ? (
          <div className="flex justify-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => dispatch({type: 'tick', seconds: 60})}>
              +1 min (debug)
            </Button>
            <Button size="sm" variant="ghost" onClick={() => dispatch({type: 'skipStage'})}>
              Fin de etapa (debug)
            </Button>
          </div>
        ) : null}
      </div>

      <SessionLog session={session} stages={stages} />

      {isBreak ? <MicroQuestion key={session.stageIndex} /> : null}

      <ConfirmDialog
        open={confirmEnd}
        title="¿Terminar la sesión?"
        description="Verás el resumen. Los bloques de estudio ya completados cuentan para tu progreso; el bloque en curso no."
        confirmLabel="Terminar sesión"
        cancelLabel="Seguir estudiando"
        destructive={false}
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          finish();
        }}
      />

      <TabLeftDialog open={tabLeftOpen && blindadoOn} count={tabLeaves} reason={leaveReason} onClose={dismissTabLeft} />
    </section>
  );
}

const LEAVE_TITLES: Record<LeaveReason, string> = {
  tab: 'Saliste de la pestaña',
  window: 'Cambiaste de ventana',
};

function TabLeftDialog({
  open,
  count,
  reason,
  onClose,
}: {
  open: boolean;
  count: number;
  reason: LeaveReason;
  onClose: () => void;
}) {
  const backRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open={open}
      role="alertdialog"
      size="sm"
      title={LEAVE_TITLES[reason]}
      description="Estás en modo blindado: la sesión sigue en marcha. Vuelve a concentrarte."
      onClose={onClose}
      hideCloseButton
      initialFocusRef={backRef}
      footer={
        <Button ref={backRef} onClick={onClose}>
          Volver a la sesión
        </Button>
      }
    >
      <p className="text-small text-default">
        Salidas de la sesión: <span className="tabular-nums text-strong">{count}</span>
      </p>
    </Dialog>
  );
}

function SessionLog({session, stages}: {session: SessionState; stages: Stage[]}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-mono text-caption uppercase tracking-widest text-muted">Registro</span>
      <ol aria-label="Registro de la sesión" className="flex flex-wrap gap-1.5">
        {stages.map((st, i) => {
          const state = i < session.stageIndex ? 'completado' : i === session.stageIndex ? 'en curso' : 'pendiente';
          const name = st.type === 'study' ? `Estudio ${st.block}` : st.type === 'short' ? 'Descanso corto' : 'Descanso largo';
          const tone = st.type === 'study' ? 'primary' : 'success';
          return (
            <li key={i}>
              <span
                aria-hidden
                className={[
                  'block size-4 rounded-small border-2',
                  tone === 'primary' ? 'border-primary' : 'border-success',
                  state === 'completado' ? (tone === 'primary' ? 'bg-primary' : 'bg-success') : '',
                  state === 'en curso' ? 'ring-2 ring-focus ring-offset-2 ring-offset-page' : '',
                ].join(' ')}
              />
              <span className="sr-only">{`${name}: ${state}`}</span>
            </li>
          );
        })}
      </ol>
      <span className="text-caption text-muted">Estudio y descansos</span>
    </div>
  );
}

function MicroQuestion() {
  const {activeNotebook} = useAppState();
  const [challenge, setChallenge] = useState<RecallChallenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const hasSources = (activeNotebook?.sources.length ?? 0) > 0;

  useEffect(() => {
    if (!activeNotebook || !hasSources) return;
    let cancelled = false;
    setLoading(true);
    requestChallenge(activeNotebook)
      .then((c) => !cancelled && setChallenge(c))
      .catch(() => {
        if (cancelled) return;
        const source = activeNotebook.sources[0];
        const sentence = (source.content || '')
          .split(/[.!?]+/)
          .map((s) => s.trim())
          .find((s) => s.length > 20);
        setChallenge({
          challengeQuestion: `¿Cuál es el concepto central que recuerdas de «${source.title}»?`,
          expectedKeyPoints: [],
          canonicalAnswer: sentence ?? '',
          sourceReference: source.title,
        });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // One question per break (the parent remounts this per stage).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="space-y-3 bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-h2 text-strong">Micro-pregunta de descanso</h3>
        <SimulatedBadge />
      </div>
      {!hasSources ? (
        <p className="text-small text-muted">Agrega una fuente al cuaderno para tener micro-preguntas en los descansos.</p>
      ) : loading || !challenge ? (
        <p className="flex items-center gap-2 text-small text-muted">
          <Spinner /> Preparando una pregunta…
        </p>
      ) : (
        <>
          <p className="text-body text-default">{challenge.challengeQuestion}</p>
          {revealed ? (
            <p className="rounded-control bg-success-tint p-3 text-small text-default">
              {challenge.canonicalAnswer || 'Revisa tus fuentes para contrastar tu respuesta.'}
            </p>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setRevealed(true)}>
              Ver respuesta
            </Button>
          )}
        </>
      )}
    </Card>
  );
}
