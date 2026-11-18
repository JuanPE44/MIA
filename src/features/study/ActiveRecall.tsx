import {useRef, useState} from 'react';
import {useNavigate} from 'react-router';
import {useAppState} from '../../app/AppStateContext';
import {paths} from '../../app/routes';
import {Button, Card, EmptyState, InlineAlert, Textarea} from '../../ui';
import {evaluateAnswer, requestChallenge, type RecallChallenge, type RecallEvaluation} from './recallApi';
import {Icon} from '../../ui/Icon';

type Phase = 'idle' | 'loading' | 'question' | 'compared' | 'error';

/** S7c: generate a question, answer from memory, compare with the reference. */
export function ActiveRecall() {
  const {activeNotebook} = useAppState();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('idle');
  const [challenge, setChallenge] = useState<RecallChallenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<RecallEvaluation | null>(null);
  const [comparing, setComparing] = useState(false);
  const questionRef = useRef<HTMLHeadingElement>(null);

  if (!activeNotebook) return null;

  if (activeNotebook.sources.length === 0) {
    return (
      <Card className="mx-auto w-full max-w-reading p-6">
        <EmptyState
          icon={<Icon name="brain" />}
          title="Necesitas al menos una fuente"
          description="El repaso activo hace preguntas sobre tus fuentes. Agrega una para empezar."
          action={
            <Button variant="primary" onClick={() => navigate(paths.notebookSegment(activeNotebook.id, 'FUENTES'))}>
              Ir a Fuentes
            </Button>
          }
        />
      </Card>
    );
  }

  const compare = async () => {
    if (!challenge) return;
    setComparing(true);
    const result = await evaluateAnswer(activeNotebook, challenge, answer);
    setEvaluation(result);
    setComparing(false);
    setPhase('compared');
  };

  const generate = async () => {
    setPhase('loading');
    setAnswer('');
    setEvaluation(null);
    try {
      const next = await requestChallenge(activeNotebook);
      setChallenge(next);
      setPhase('question');
      // The heading is mounted after this state update.
      requestAnimationFrame(() => questionRef.current?.focus());
    } catch {
      setPhase('error');
    }
  };

  return (
    <Card className="mx-auto w-full max-w-reading space-y-6 p-6">
      <div className="space-y-1">
        <h2 className="text-h1 text-strong">Repaso activo</h2>
        <p className="text-small text-muted">
          Intenta recordar sin mirar tus apuntes y luego compara con las fuentes.
        </p>
      </div>

      {phase === 'idle' ? (
        <Button variant="primary" onClick={generate}>
          Generar pregunta
        </Button>
      ) : null}

      {phase === 'loading' ? (
        <Button variant="primary" loading disabled>
          Generando pregunta…
        </Button>
      ) : null}

      {phase === 'error' ? (
        <InlineAlert
          variant="danger"
          live
          title="No pudimos generar la pregunta"
          actions={
            <Button size="sm" variant="secondary" onClick={generate}>
              Reintentar
            </Button>
          }
        >
          Revisa tu conexión e inténtalo de nuevo.
        </InlineAlert>
      ) : null}

      {challenge && (phase === 'question' || phase === 'compared') ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <h3 ref={questionRef} tabIndex={-1} className="font-display text-h1 text-strong outline-none">
              {challenge.challengeQuestion}
            </h3>
          </div>

          <Textarea
            label="Tu respuesta"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            minRows={4}
            readOnly={phase === 'compared'}
          />

          {phase === 'question' ? (
            <Button
              variant="primary"
              disabled={!answer.trim()}
              disabledReason="Escribe tu respuesta primero"
              loading={comparing}
              onClick={compare}
            >
              Comparar con la respuesta
            </Button>
          ) : (
            <div className="space-y-5">
              {evaluation ? (
                <InlineAlert
                  variant={evaluation.level === 'alto' ? 'success' : evaluation.level === 'medio' ? 'warning' : 'danger'}
                  live
                  title={`Coincidencia con las ideas clave: ${evaluation.score}%`}
                >
                  {evaluation.feedback}
                </InlineAlert>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <section aria-labelledby="recall-yours" className="space-y-2 rounded-card border border-rule bg-subtle p-4">
                  <h4 id="recall-yours" className="font-mono text-caption uppercase tracking-widest text-muted">
                    Tu respuesta
                  </h4>
                  <p className="whitespace-pre-wrap text-small text-default">{answer}</p>
                </section>
                <section aria-labelledby="recall-ref" className="space-y-2 rounded-card border border-success bg-success-tint p-4">
                  <h4 id="recall-ref" className="font-mono text-caption uppercase tracking-widest text-muted">
                    Respuesta de referencia
                  </h4>
                  <p className="text-small text-default">{challenge.canonicalAnswer}</p>
                  {challenge.expectedKeyPoints.length > 0 ? (
                    <>
                      <p className="pt-1 text-caption text-muted">Puntos que deberías mencionar</p>
                      <ul className="list-disc space-y-1 pl-5 text-small text-default">
                        {challenge.expectedKeyPoints.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </section>
              </div>
              {challenge.sourceReference ? (
                <p className="text-caption text-muted">Fuente: {challenge.sourceReference}</p>
              ) : null}
              <Button variant="secondary" onClick={generate}>
                Otra pregunta
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}
