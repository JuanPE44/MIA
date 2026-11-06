import {Button, Dialog} from '../../ui';
import type {CitationChunk} from '../../types';

interface CitationInspectorProps {
  chunk: CitationChunk | null;
  onClose: () => void;
  onOpenSources: () => void;
}

/** Shows the retrieved passage behind a citation returned by the chat service. */
export function CitationInspector({chunk, onClose, onOpenSources}: CitationInspectorProps) {
  return (
    <Dialog
      open={chunk !== null}
      onClose={onClose}
      title={chunk ? `Fuente ${chunk.index}` : ''}
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              onOpenSources();
            }}
          >
            Ver en Fuentes
          </Button>
          <Button variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      {chunk ? (
        <div className="space-y-4">
          <dl className="grid gap-3 text-small sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-caption text-muted">Documento</dt>
              <dd className="break-words text-body-strong text-strong">{chunk.sourceTitle}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-caption text-muted">Sección</dt>
              <dd className="break-words text-default">{chunk.sectionTitle}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-caption text-muted">Ubicación</dt>
              <dd className="break-words text-default">{chunk.location}</dd>
            </div>
          </dl>
          <div>
            <p className="mb-2 text-caption text-muted">Fragmento recuperado</p>
            <blockquote className="max-h-64 select-text overflow-y-auto whitespace-pre-wrap rounded-control border-l-4 border-primary-tint-border bg-subtle p-4 text-body text-default">
              {chunk.snippet}
            </blockquote>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
