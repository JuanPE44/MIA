import {useState} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {Button, InlineAlert} from '../../../ui';
import {Icon} from '../../../ui/Icon';

interface Flashcard {
  question: string;
  answer: string;
  category?: string;
  hint?: string;
}

/**
 * Interactive flashcards (component spec §6.9): 3:2 card, flip on click /
 * Space / Enter (it is one button), hint, previous / next, "3 de 12".
 * The flip animation is dropped under `prefers-reduced-motion`.
 */
export function FlashcardsView({cards}: {cards: Flashcard[]}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const reduced = useReducedMotion();

  const card = cards[index] ?? cards[0];
  if (!card) return null;

  const go = (delta: number) => {
    setFlipped(false);
    setShowHint(false);
    setIndex((prev) => (prev + delta + cards.length) % cards.length);
  };

  const face = 'absolute inset-0 flex flex-col justify-between overflow-auto rounded-card border p-5 [backface-visibility:hidden] sm:p-8';

  return (
    <div className="w-full max-w-narrow space-y-4">
      <div className="[perspective:1200px]">
        <button
          type="button"
          onClick={() => setFlipped((v) => !v)}
          className="relative block aspect-[3/2] min-h-60 w-full cursor-pointer select-none rounded-card text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        >
          <span className="sr-only">
            {flipped ? 'Mostrando la respuesta. Pulsa para volver a la pregunta.' : 'Mostrando la pregunta. Pulsa para ver la respuesta.'}
          </span>
          <motion.span
            aria-hidden
            className="absolute inset-0 block [transform-style:preserve-3d]"
            initial={false}
            animate={{rotateY: flipped && !reduced ? 180 : 0}}
            transition={reduced ? {duration: 0} : {type: 'spring', stiffness: 170, damping: 18, mass: 0.9}}
          >
            <span className={`${face} border-ink bg-surface shadow-offset ${reduced && flipped ? 'hidden' : ''}`}>
              <span className="flex items-center justify-between font-mono text-caption uppercase tracking-widest text-muted">
                <span>Pregunta</span>
                <span className="rounded-pill bg-subtle px-2 py-0.5 normal-case tracking-normal text-default">{card.category || 'Concepto'}</span>
              </span>
              <span className="my-4 font-display text-h1 text-strong">{card.question}</span>
              <span className="text-caption text-muted">Pulsa para ver la respuesta</span>
            </span>
            <span
              className={`${face} border-ink bg-highlight text-highlight-ink shadow-offset ${reduced ? (flipped ? '' : 'hidden') : '[transform:rotateY(180deg)]'}`}
            >
              <span className="font-mono text-caption uppercase tracking-widest">Respuesta</span>
              <span className="my-4 font-display text-h1">{card.answer}</span>
              <span className="text-caption">Pulsa para volver a la pregunta</span>
            </span>
          </motion.span>
          {/* Visible face as real text for assistive tech (the 3D faces above are decorative). */}
          <span className="sr-only">{flipped ? card.answer : card.question}</span>
        </button>
      </div>

      {showHint && card.hint && !flipped ? (
        <InlineAlert variant="info" live title="Pista">
          {card.hint}
        </InlineAlert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" leadingIcon={<Icon name="chevron-left" className="size-4" />} onClick={() => go(-1)}>
          Anterior
        </Button>
        <p className="font-mono text-small text-muted" aria-live="polite">
          {index + 1} de {cards.length}
        </p>
        <Button variant="secondary" trailingIcon={<Icon name="chevron-right" className="size-4" />} onClick={() => go(1)}>
          Siguiente
        </Button>
      </div>

      {card.hint ? (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            leadingIcon={<Icon name="idea" className="size-4" />}
            aria-pressed={showHint}
            onClick={() => setShowHint((v) => !v)}
          >
            {showHint ? 'Ocultar pista' : 'Ver pista'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
