import {useId, useRef, useState, type DragEvent} from 'react';
import {cx} from '../internal/cx';
import {useIsPhone} from '../internal/useIsPhone';
import {Button} from '../Button';
import {IconButton} from '../IconButton';
import {Spinner} from '../Spinner';
import {Icon} from '../Icon';

export interface FileDropSelection {
  name: string;
  /** Human readable size, e.g. "1,2 MB". */
  sizeLabel: string;
  /** Shows a spinner next to the file while its content is being read. */
  busy?: boolean;
}

export interface FileDropProps {
  /** Called with the picked or dropped file (single file). */
  onFileSelected: (file: File) => void;
  /** Currently chosen file; shows the file row instead of the drop area. */
  selection?: FileDropSelection | null;
  onRemove?: () => void;
  /** `accept` attribute of the file input. */
  accept?: string;
  /** Visible description of accepted types, e.g. "PDF, imágenes, audio o texto". */
  acceptedLabel: string;
  /** Visible max size, e.g. "Máximo 10 MB". */
  maxSizeLabel: string;
  /** Accessible name of the whole control. */
  label?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * Drag-and-drop area with a button alternative (spec §2.8). On phones the drop
 * area text is replaced by "Tomar foto" / "Elegir archivo" buttons.
 */
export function FileDrop({
  onFileSelected,
  selection,
  onRemove,
  accept,
  acceptedLabel,
  maxSizeLabel,
  label = 'Archivo',
  error,
  disabled,
}: FileDropProps) {
  const phone = useIsPhone();
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const errorId = useId();

  const pick = (file: File | undefined) => {
    if (file && !disabled) onFileSelected(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  };

  if (selection) {
    return (
      <div className="flex min-h-14 items-center gap-3 rounded-control border border-hairline bg-subtle px-3 py-2">
        <span
          aria-hidden
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-surface text-muted"
        >
          {selection.busy ? <Spinner size={20} /> : <Icon name="document" className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-strong text-strong">{selection.name}</p>
          <p className="text-small text-muted">{selection.busy ? `${selection.sizeLabel} · Leyendo el archivo…` : selection.sizeLabel}</p>
        </div>
        {onRemove ? (
          <IconButton
            aria-label={`Quitar el archivo ${selection.name}`}
            icon={<Icon name="close" className="size-5" />}
            onClick={onRemove}
            disabled={disabled}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div
        role="group"
        aria-label={label}
        aria-describedby={cx(hintId, error && errorId)}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx(
          'flex min-h-40 flex-col items-center justify-center gap-3 rounded-card border-[1.5px] border-dashed px-4 py-6 text-center',
          'transition-colors duration-[120ms]',
          dragging ? 'border-primary-tint-border bg-primary-tint' : 'border-control bg-surface',
          error && 'border-danger',
        )}
      >
        <Icon name="upload" className="size-6 text-muted" />
        {phone ? null : <p className="text-body text-default">Arrastra un archivo o</p>}
        <div className="flex flex-wrap justify-center gap-2">
          {phone ? (
            <Button
              variant="secondary"
              leadingIcon={<Icon name="camera" className="size-5" />}
              onClick={() => cameraRef.current?.click()}
              disabled={disabled}
            >
              Tomar foto
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={disabled}>
            Elegir archivo
          </Button>
        </div>
        <p id={hintId} className="text-small text-muted">
          {acceptedLabel}. {maxSizeLabel}.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
