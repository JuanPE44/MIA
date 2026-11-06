import {Button, Dialog} from '../../ui';
import {WebSearchPanel} from './WebSearchPanel';

interface WebSearchDialogProps {
  open: boolean;
  onClose: () => void;
  /** Question prefilled in the field (e.g. typed in the Chat composer). */
  initialQuery?: string;
}

/** "Buscar en la web" as its own dialog (lg on desktop, bottom sheet on phone). */
export function WebSearchDialog({open, onClose, initialQuery}: WebSearchDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Buscar en la web"
      description="Consulta información actual en internet. Revisa siempre las fuentes antes de usarla."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <WebSearchPanel initialQuery={initialQuery} />
    </Dialog>
  );
}
