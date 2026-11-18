import {useState} from 'react';
import {Button, Dialog} from '../../ui';
import {FolderCoverPicker} from './FolderCoverPicker';

interface ChangeCoverDialogProps {
  folderName: string;
  initialCover?: string;
  onClose: () => void;
  onSave: (cover: string | undefined) => void;
}

/** Mounted only while open, so its state resets on every open. */
export function ChangeCoverDialog({folderName, initialCover, onClose, onSave}: ChangeCoverDialogProps) {
  const [cover, setCover] = useState(initialCover ?? '');
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Portada de «${folderName}»`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave(cover || undefined);
              onClose();
            }}
          >
            Guardar
          </Button>
        </>
      }
    >
      <FolderCoverPicker legend="Portada" value={cover} onChange={setCover} />
    </Dialog>
  );
}
