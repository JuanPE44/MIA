import {useId, useState, type FormEvent} from 'react';
import type {Folder, Notebook} from '../../types';
import {Button, Dialog} from '../../ui';

interface MoveNotebookDialogProps {
  notebook: Notebook;
  folders: Folder[];
  onClose: () => void;
  /** `null` = Sin carpeta. */
  onMove: (folderId: string | null) => void;
}

export function MoveNotebookDialog({notebook, folders, onClose, onMove}: MoveNotebookDialogProps) {
  const formId = useId();
  const groupName = useId();
  const current = notebook.folderId && folders.some((f) => f.id === notebook.folderId) ? notebook.folderId : '';
  const [target, setTarget] = useState(current);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onClose();
    if (target !== current) onMove(target || null);
  };

  const options = [{id: '', label: 'Sin carpeta', icon: '📄'}, ...folders.map((f) => ({id: f.id, label: f.name, icon: f.icon || '📁'}))];

  return (
    <Dialog
      open
      onClose={onClose}
      title="Mover a…"
      description={`Elige dónde guardar «${notebook.title}».`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            Mover
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit}>
        <fieldset>
          <legend className="sr-only">Carpeta de destino</legend>
          <div className="flex flex-col gap-1">
            {options.map((o) => (
              <label
                key={o.id || 'none'}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-3 hover:bg-subtle has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-2px] has-[:focus-visible]:outline-focus"
              >
                <input
                  type="radio"
                  name={groupName}
                  checked={target === o.id}
                  onChange={() => setTarget(o.id)}
                  className="size-5 accent-[var(--mia-primary)]"
                />
                <span aria-hidden>{o.icon}</span>
                <span className="text-body text-strong">{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
