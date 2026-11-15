import {useRef, type KeyboardEvent, type RefObject} from 'react';
import {Button, IconButton, Textarea} from '../../ui';
import {Icon} from '../../ui/Icon';

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** True while an answer is pending: sending is blocked. */
  waiting: boolean;
  /** When set, the field is disabled and this text explains why. */
  disabledReason?: string;
  activeSources: number;
  totalSources: number;
  onOpenSources: () => void;
  onSearchWeb: () => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}

/** Multi-line question field: Enter sends, Shift+Enter inserts a new line (UX-27). */
export function Composer({
  value,
  onChange,
  onSend,
  waiting,
  disabledReason,
  activeSources,
  totalSources,
  onOpenSources,
  onSearchWeb,
  inputRef,
}: ComposerProps) {
  const fallbackRef = useRef<HTMLTextAreaElement | null>(null);
  const ref = inputRef ?? fallbackRef;
  const blocked = Boolean(disabledReason);
  const canSend = value.trim().length > 0 && !waiting && !blocked;

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (canSend) onSend();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSend();
      }}
      className="rounded-card border border-rule bg-surface p-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus"
    >
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1 [&_label]:sr-only [&_textarea]:border-0 [&_textarea]:bg-transparent [&_textarea]:outline-none">
          <Textarea
            ref={ref}
            label="Tu pregunta"
            placeholder="Pregunta sobre tus fuentes…"
            minRows={1}
            maxRows={6}
            value={value}
            disabled={blocked}
            aria-describedby={blocked ? 'chat-composer-reason' : 'chat-composer-hint'}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        <IconButton
          type="submit"
          variant="primary"
          aria-label="Enviar pregunta"
          icon={<Icon name="send" className="size-5" />}
          disabled={!canSend}
        />
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
        <p id={blocked ? 'chat-composer-reason' : 'chat-composer-hint'} className="text-caption text-muted">
          {blocked ? disabledReason : 'Enter envía · Mayús+Enter agrega una línea'}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onOpenSources} className="font-mono text-muted!">
            Fuentes activas: {activeSources} de {totalSources}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Icon name="web" className="size-4" />}
            onClick={onSearchWeb}
            className="text-muted!"
          >
            Buscar en la web
          </Button>
        </div>
      </div>
    </form>
  );
}
