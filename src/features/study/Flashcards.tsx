import {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router';
import {useAppState} from '../../app/AppStateContext';
import {paths} from '../../app/routes';
import {Button, Card, EmptyState, InlineAlert, StatusBadge, useToast} from '../../ui';
import type {FlashcardItem} from '../../types';
import {useStudySession} from './StudySessionProvider';
import {Icon} from '../../ui/Icon';

const XP_PER_CARD = 15;

interface Deck {
  id: string;
  card: FlashcardItem;
}

/** S7d: flashcards from the notebook's Tarjetas material. */
export function Flashcards() {
  const {activeNotebook, stats, handleUpdateStats} = useAppState();
  const {masteredCardIds, markCardMastered} = useStudySession();
  const toast = useToast();
  const navigate = useNavigate();

  const deck = useMemo<Deck[]>(() => {
    const artifact = activeNotebook?.artifacts.find((a) => a.type === 'flashcards');
    const list: FlashcardItem[] = Array.isArray(artifact?.structuredData) ? artifact.structuredData : [];
    return list.map((card, i) => ({id: card.id || `card-${i}`, card}));
  }, [activeNotebook]);

  // `onlyIds`: "Repasar no dominadas" restricts the round to those cards.
  const [onlyIds, setOnlyIds] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [done, setDone] = useState(false);

  const round = useMemo(() => (onlyIds ? deck.filter((d) => onlyIds.includes(d.id)) : deck), [deck, onlyIds]);
  const current = round[index];

  useEffect(() => {
    setFlipped(false);
    setHintShown(false);
  }, [index, onlyIds]);

  if (!activeNotebook) return null;

  if (deck.length === 0) {
    return (
      <Card className="w-full max-w-reading p-6">
        <EmptyState
          icon={<Icon name="materials" />}
          title="Crea un material de Tarjetas"
          description="Aún no hay un mazo en este cuaderno. Genéralo desde Materiales a partir de tus fuentes."
          action={
            <Button variant="primary" onClick={() => navigate(paths.notebookSegment(activeNotebook.id, 'ARTEFACTOS'))}>
              Ir a Materiales
            </Button>
          }
        />
      </Card>
    );
  }

  const advance = () => {
    if (index + 1 >= round.length) setDone(true);
    else setIndex(index + 1);
  };

  const master = () => {
    if (!current) return;
    if (markCardMastered(current.id)) {
      handleUpdateStats({
        flashcardsMastered: stats.flashcardsMastered + 1,
        xpPoints: stats.xpPoints + XP_PER_CARD,
      });
      toast.show({message: `+${XP_PER_CARD} XP`, variant: 'success'});
    }
    advance();
  };

  if (done) {
    const pending = deck.filter((d) => !masteredCardIds.has(d.id));
    const mastered = deck.length - pending.length;
    return (
      <Card className="w-full max-w-narrow space-y-5 p-6">
        <h2 className="text-h1 text-strong">Terminaste el mazo</h2>
        <p className="text-body text-default">
          Dominas {mastered} de {deck.length} tarjetas.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {pending.length > 0 ? (
            <Button
              variant="primary"
              onClick={() => {
                setOnlyIds(pending.map((d) => d.id));
                setIndex(0);
                setDone(false);
              }}
            >
              Repasar no dominadas
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => {
              setOnlyIds(null);
              setIndex(0);
              setDone(false);
            }}
          >
            Empezar de nuevo
          </Button>
        </div>
      </Card>
    );
  }

  if (!current) return null;
  const isMastered = masteredCardIds.has(current.id);

  return (
    <div className="w-full max-w-narrow space-y-5">
      <h2 className="sr-only">Tarjetas</h2>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-label text-muted">
          {index + 1} de {round.length}
        </span>
        <div className="flex items-center gap-2">
          {isMastered ? <StatusBadge variant="success">Dominada</StatusBadge> : null}
          {current.card.category ? <StatusBadge variant="info">{current.card.category}</StatusBadge> : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={[
          'flex aspect-[3/2] w-full flex-col justify-between rounded-card border border-rule p-6 text-center transition-[box-shadow,border-color] hover:border-ink hover:shadow-offset focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus',
          flipped ? 'bg-subtle text-strong' : 'bg-surface',
        ].join(' ')}
      >
        <span className={`font-mono text-caption uppercase tracking-widest ${flipped ? '' : 'text-muted'}`}>{flipped ? 'Respuesta' : 'Pregunta'}</span>
        <span aria-live="polite" className={`font-display text-h1 ${flipped ? '' : 'text-strong'}`}>
          {flipped ? current.card.answer : current.card.question}
        </span>
        <span className={`text-caption ${flipped ? '' : 'text-muted'}`}>Pulsa o usa Espacio / Enter para voltear</span>
      </button>

      {current.card.hint ? (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Icon name="idea" className="size-4" />}
            aria-expanded={hintShown}
            onClick={() => setHintShown((h) => !h)}
          >
            {hintShown ? 'Ocultar pista' : 'Pista'}
          </Button>
          {hintShown ? <InlineAlert variant="info">{current.card.hint}</InlineAlert> : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Anterior
        </Button>
        <Button variant="primary" leadingIcon={<Icon name="award" className="size-4" />} onClick={master}>
          La domino (+{XP_PER_CARD} XP)
        </Button>
        <Button variant="secondary" onClick={advance}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
