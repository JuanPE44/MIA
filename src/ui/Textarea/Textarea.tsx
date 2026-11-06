import {useCallback, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode} from 'react';
import {cx} from '../internal/cx';
import {describedBy, FieldShell, fieldBase, fieldBorder} from '../internal/FieldShell';

export interface TextareaProps extends Omit<ComponentProps<'textarea'>, 'rows'> {
  label: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  /** Minimum visible rows (default 3). */
  minRows?: number;
  /** Auto-grows up to this many rows, then scrolls (default 8). */
  maxRows?: number;
}

const LINE = 24; // body line-height in px
const PAD = 16; // py-2 * 2
const BORDER = 2;

export function Textarea({
  label,
  helper,
  error,
  minRows = 3,
  maxRows = 8,
  id: idProp,
  className,
  onInput,
  ref,
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const invalid = Boolean(error);
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const [length, setLength] = useState(0);

  const resize = useCallback(() => {
    const el = inner.current;
    if (!el) return;
    el.style.height = 'auto';
    const min = minRows * LINE + PAD + BORDER;
    const max = maxRows * LINE + PAD + BORDER;
    const next = Math.min(Math.max(el.scrollHeight + BORDER, min), max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight + BORDER > max ? 'auto' : 'hidden';
    setLength(el.value.length);
  }, [minRows, maxRows]);

  useLayoutEffect(resize, [resize, rest.value]);

  const setRefs = (node: HTMLTextAreaElement | null) => {
    inner.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <FieldShell
      id={id}
      label={label}
      helper={helper}
      error={error}
      counter={rest.maxLength ? `${length} / ${rest.maxLength}` : undefined}
    >
      <textarea
        {...rest}
        ref={setRefs}
        id={id}
        data-mia-ui
        rows={minRows}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy(id, Boolean(helper), invalid, rest['aria-describedby'])}
        onInput={(e) => {
          resize();
          onInput?.(e);
        }}
        className={cx(fieldBase, fieldBorder(invalid), 'resize-none py-2 leading-6', className)}
      />
    </FieldShell>
  );
}
