import {useId, useState} from 'react';
import {Button, InlineAlert} from '../../../ui';
import {Icon} from '../../../ui/Icon';

interface QuizQuestion {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  sourceCitation?: string;
}

/** Interactive quiz: pick answers, then "Verificar respuestas" shows results (same logic as the legacy viewer). */
export function QuizView({questions}: {questions: QuizQuestion[]}) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const baseId = useId();

  const answered = Object.keys(selected).length;
  const correct = questions.filter((q, i) => selected[i] === q.correctAnswer).length;

  return (
    <div className="mx-auto w-full max-w-[720px] space-y-5">
      <div className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-h3 text-strong">Cuestionario con autoevaluación</h2>
          <p className="text-small text-muted">
            Elige una respuesta en cada pregunta ({answered} de {questions.length}).
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowResults((v) => !v)} aria-pressed={showResults}>
          {showResults ? 'Ocultar corrección' : 'Verificar respuestas'}
        </Button>
      </div>

      {showResults ? (
        <InlineAlert variant={correct === questions.length ? 'success' : 'info'} live title="Tu resultado">
          Acertaste {correct} de {questions.length} preguntas.
        </InlineAlert>
      ) : null}

      <ol className="space-y-4">
        {questions.map((q, qIdx) => {
          const chosen = selected[qIdx];
          const isCorrect = chosen === q.correctAnswer;
          const headingId = `${baseId}-q${qIdx}`;
          return (
            <li key={qIdx} className="rounded-card border border-hairline bg-surface p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-pill bg-primary-tint text-caption text-primary-on-tint"
                >
                  {qIdx + 1}
                </span>
                <h3 id={headingId} className="text-body-strong text-strong">
                  {q.question}
                </h3>
              </div>

              <div role="group" aria-labelledby={headingId} className="mt-3 space-y-2 sm:pl-9">
                {q.options?.map((opt, optIdx) => {
                  const isChosen = chosen === opt;
                  const isRight = opt === q.correctAnswer;
                  let tone = 'border-hairline bg-surface text-default hover:bg-subtle';
                  if (showResults) {
                    if (isRight) tone = 'border-success bg-success-tint text-strong';
                    else if (isChosen) tone = 'border-danger bg-danger-tint text-strong';
                    else tone = 'border-hairline bg-surface text-muted';
                  } else if (isChosen) {
                    tone = 'border-primary-tint-border bg-primary-tint text-primary-on-tint';
                  }
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      aria-pressed={isChosen}
                      onClick={() => setSelected((prev) => ({...prev, [qIdx]: opt}))}
                      className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-control border px-3 py-2 text-left text-small transition-colors duration-[120ms] ${tone}`}
                    >
                      <span>{opt}</span>
                      {showResults && isRight ? (
                        <span className="flex shrink-0 items-center gap-1 text-caption text-success">
                          <Icon name="success" className="size-4" />
                          Correcta
                        </span>
                      ) : null}
                      {showResults && isChosen && !isRight ? (
                        <span className="flex shrink-0 items-center gap-1 text-caption text-danger">
                          <Icon name="error-circle" className="size-4" />
                          Tu respuesta
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {showResults ? (
                <div className="mt-3 border-t border-hairline pt-3 text-small sm:ml-9">
                  <p className="text-label text-strong">
                    {chosen === undefined ? 'Sin responder.' : isCorrect ? '¡Correcto!' : 'Incorrecto.'}
                  </p>
                  {q.explanation ? <p className="mt-1 text-default">{q.explanation}</p> : null}
                  {q.sourceCitation ? <p className="mt-1 text-caption italic text-muted">{q.sourceCitation}</p> : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
