import {useId, useState} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {Button, InlineAlert, Reveal, RevealItem} from '../../../ui';
import {Icon} from '../../../ui/Icon';

interface QuizQuestion {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  sourceCitation?: string;
}

/** Check mark drawn with stroke-dashoffset (static under reduced motion). */
function DrawnCheck() {
  const reduced = useReducedMotion();
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 text-success" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <motion.path
        d="M4 12.5l5 5L20 6.5"
        pathLength={1}
        strokeDasharray={1}
        initial={reduced ? false : {strokeDashoffset: 1}}
        animate={{strokeDashoffset: 0}}
        transition={{duration: 0.45, ease: [0.16, 1, 0.3, 1]}}
      />
    </svg>
  );
}

/** Interactive quiz: pick answers, then "Verificar respuestas" shows results (same logic as the legacy viewer). */
export function QuizView({questions}: {questions: QuizQuestion[]}) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const baseId = useId();

  const answered = Object.keys(selected).length;
  const correct = questions.filter((q, i) => selected[i] === q.correctAnswer).length;

  return (
    <div className="w-full max-w-reading space-y-5">
      <div className="flex flex-col gap-3 rounded-card border-[1.5px] border-ink bg-surface p-4 shadow-offset sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="font-display text-h2 text-strong">Cuestionario con autoevaluación</h2>
          <p className="font-mono text-caption text-muted">
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

      <Reveal as="ol" className="space-y-4">
        {questions.map((q, qIdx) => {
          const chosen = selected[qIdx];
          const isCorrect = chosen === q.correctAnswer;
          const headingId = `${baseId}-q${qIdx}`;
          return (
            <RevealItem as="li" key={qIdx} className="rounded-card border border-rule bg-surface p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-small bg-highlight font-mono text-caption text-highlight-ink"
                >
                  {qIdx + 1}
                </span>
                <h3 id={headingId} className="font-display text-h3 text-strong">
                  {q.question}
                </h3>
              </div>

              <div role="group" aria-labelledby={headingId} className="mt-3 space-y-2 sm:pl-9">
                {q.options?.map((opt, optIdx) => {
                  const isChosen = chosen === opt;
                  const isRight = opt === q.correctAnswer;
                  let tone = 'border-rule bg-surface text-default hover:border-ink hover:bg-subtle';
                  if (showResults) {
                    if (isRight) tone = 'border-success bg-success-tint text-strong';
                    else if (isChosen) tone = 'border-danger bg-danger-tint text-strong';
                    else tone = 'border-rule bg-surface text-muted';
                  } else if (isChosen) {
                    tone = 'border-ink bg-primary-tint text-primary-on-tint shadow-offset';
                  }
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      aria-pressed={isChosen}
                      onClick={() => setSelected((prev) => ({...prev, [qIdx]: opt}))}
                      className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-control border px-3 py-2 text-left text-small transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${tone}`}
                    >
                      <span>{opt}</span>
                      {showResults && isRight ? (
                        <span className="flex shrink-0 items-center gap-1 text-caption text-success">
                          <DrawnCheck />
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
                <div className="mt-3 border-t border-rule pt-3 text-small sm:ml-9">
                  <p className="text-label text-strong">
                    {chosen === undefined ? 'Sin responder.' : isCorrect ? '¡Correcto!' : 'Incorrecto.'}
                  </p>
                  {q.explanation ? <p className="mt-1 text-default">{q.explanation}</p> : null}
                  {q.sourceCitation ? <p className="mt-1 text-caption italic text-muted">{q.sourceCitation}</p> : null}
                </div>
              ) : null}
            </RevealItem>
          );
        })}
      </Reveal>
    </div>
  );
}
