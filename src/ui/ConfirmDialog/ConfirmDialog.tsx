import {useRef, type ReactNode} from 'react';
import {Dialog} from '../Dialog';
import {Button} from '../Button';

export interface ConfirmDialogProps {
  open: boolean;
  /** Cancel / Escape / backdrop. */
  onCancel: () => void;
  onConfirm: () => void;
  /** States the action, e.g. «¿Eliminar el cuaderno «Lean Startup»?». */
  title: ReactNode;
  /** States the consequence, e.g. "No se puede deshacer.". */
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive styling for the confirm button (default true). */
  destructive?: boolean;
  loading?: boolean;
}

/** `alertdialog` with initial focus on Cancelar (spec §5.3). */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  destructive = true,
  loading,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      role="alertdialog"
      hideCloseButton
      dismissible={!loading}
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
