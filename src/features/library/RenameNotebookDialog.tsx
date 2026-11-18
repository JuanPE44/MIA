import {useId, useRef, useState, type FormEvent} from 'react';
import type {Notebook} from '../../types';
import {Button, Dialog, TextField} from '../../ui';

interface RenameNotebookDialogProps {
  notebook: Notebook;
  onClose: () => void;
  onRename: (title: string) => void;
}

/** Mounted only while open, so its state resets on every open. */
export function RenameNotebookDialog({notebook, onClose, onRename}: RenameNotebookDialogProps) {
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(notebook.title);
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Escribe un nombre para el cuaderno');
      inputRef.current?.focus();
      return;
    }
    onRename(title.trim());
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Renombrar cuaderno"
      size="sm"
      initialFocusRef={inputRef}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            Guardar
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit}>
        <TextField
          ref={inputRef}
          label="Nombre del cuaderno"
          value={title}
          autoComplete="off"
          error={error || undefined}
          onChange={(e) => {
            setTitle(e.target.value);
            setError('');
          }}
        />
      </form>
    </Dialog>
  );
}
