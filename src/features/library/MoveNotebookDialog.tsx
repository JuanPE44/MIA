import {useId, useState, type FormEvent} from 'react';
import type {Folder, Notebook} from '../../types';
import {Button, Dialog, Icon, Radio, RadioGroup, resolveItemIcon, type IconName} from '../../ui';

interface MoveNotebookDialogProps {
  notebook: Notebook;
  folders: Folder[];
  onClose: () => void;
  /** `null` = Sin carpeta. */
  onMove: (folderId: string | null) => void;
}

export function MoveNotebookDialog({notebook, folders, onClose, onMove}: MoveNotebookDialogProps) {
  const formId = useId();
  const current = notebook.folderId && folders.some((f) => f.id === notebook.folderId) ? notebook.folderId : '';
  const [target, setTarget] = useState(current);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onClose();
    if (target !== current) onMove(target || null);
  };

  const options = [{id: '', label: 'Sin carpeta', icon: 'folder-open' as IconName}, ...folders.map((f) => ({id: f.id, label: f.name, icon: resolveItemIcon(f.icon, 'folder')}))];

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
        <RadioGroup legend="Carpeta de destino" legendHidden value={target} onChange={setTarget}>
          {options.map((o) => (
            <Radio
              key={o.id || 'none'}
              value={o.id}
              label={o.label}
              leading={<Icon name={o.icon} weight="duotone" className="size-5" />}
            />
          ))}
        </RadioGroup>
      </form>
    </Dialog>
  );
}
