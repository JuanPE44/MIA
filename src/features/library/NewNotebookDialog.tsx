import {useId, useRef, useState, type FormEvent} from 'react';
import type {Folder, Notebook} from '../../types';
import {Button, Dialog, IconPicker, Textarea, TextField} from '../../ui';
import {SelectField} from './SelectField';
import {NOTEBOOK_ICONS} from './libraryModel';

interface NewNotebookDialogProps {
  folders: Folder[];
  /** Folder preselected from the active filter ('' = none). */
  initialFolderId: string;
  onClose: () => void;
  onCreate: (data: Partial<Notebook>) => void;
}

/** Mounted only while open, so its state resets on every open. */
export function NewNotebookDialog({folders, initialFolderId, onClose, onCreate}: NewNotebookDialogProps) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [folderId, setFolderId] = useState(initialFolderId);
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<string>(NOTEBOOK_ICONS[0]);
  const [titleError, setTitleError] = useState('');

  const validateTitle = (value: string) => {
    const message = value.trim() ? '' : 'Escribe un título para el cuaderno';
    setTitleError(message);
    return !message;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateTitle(title)) {
      titleRef.current?.focus();
      return;
    }
    onCreate({
      title: title.trim(),
      icon,
      subject: subject.trim() || 'General',
      description: description.trim() || 'Cuaderno de estudio temático.',
      folderId: folderId || null,
    });
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Nuevo cuaderno"
      size="md"
      initialFocusRef={titleRef}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            Crear cuaderno
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          ref={titleRef}
          label="Título (obligatorio)"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) validateTitle(e.target.value);
          }}
          onBlur={(e) => {
            if (titleError || e.target.value) validateTitle(e.target.value);
          }}
          error={titleError}
          aria-required="true"
          autoComplete="off"
        />
        <TextField label="Materia (opcional)" value={subject} onChange={(e) => setSubject(e.target.value)} autoComplete="off" />
        <SelectField label="Carpeta (opcional)" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
          <option value="">Sin carpeta</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </SelectField>
        <Textarea
          label="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          minRows={2}
        />
        <IconPicker label="Ícono" icons={NOTEBOOK_ICONS} value={icon} onChange={setIcon} />
      </form>
    </Dialog>
  );
}
