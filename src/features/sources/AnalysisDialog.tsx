import type {SourceItem} from '../../types';
import {Button, Dialog, InlineAlert, SimulatedBadge} from '../../ui';
import {sourceMeta} from './sourceModel';
import {Icon} from '../../ui/Icon';

interface AnalysisDialogProps {
  source: SourceItem | null;
  onClose: () => void;
  onAsk: (source: SourceItem) => void;
}

/** "Ver análisis": per-source analysis, preview and excerpt. */
export function AnalysisDialog({source, onClose, onAsk}: AnalysisDialogProps) {
  const hasAnalysis = Boolean(
    source?.analysisSummary ||
      source?.processedConcepts?.length ||
      source?.processedAuthors?.length ||
      source?.processedKeyDetails?.length,
  );
  return (
    <Dialog
      open={source !== null}
      onClose={onClose}
      size="md"
      title={source?.title ?? ''}
      description={source ? sourceMeta(source) : undefined}
      footer={
        source ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              variant="primary"
              leadingIcon={<Icon name="chat" className="size-5" />}
              onClick={() => onAsk(source)}
            >
              Preguntar en el chat
            </Button>
          </>
        ) : undefined
      }
    >
      {source ? (
        <div className="flex flex-col gap-5">
          {source.fileDataUrl && source.type === 'image' ? (
            <img
              src={source.fileDataUrl}
              alt={`Vista previa de ${source.title}`}
              className="max-h-64 w-full rounded-control border border-hairline bg-subtle object-contain"
            />
          ) : null}
          {source.fileDataUrl && source.type === 'audio' ? (
            <audio controls src={source.fileDataUrl} className="w-full" aria-label={`Audio de ${source.title}`} />
          ) : null}

          {hasAnalysis ? (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-h3 text-strong">Análisis</h3>
                <SimulatedBadge />
              </div>
              {source.analysisSummary ? <p className="text-body text-default">{source.analysisSummary}</p> : null}
              {source.processedAuthors && source.processedAuthors.length > 0 ? (
                <p className="text-body text-default">
                  <span className="text-body-strong text-strong">Autores: </span>
                  {source.processedAuthors.join(', ')}
                </p>
              ) : null}
              {source.processedConcepts && source.processedConcepts.length > 0 ? (
                <div>
                  <h4 className="text-label text-muted">Conceptos clave</h4>
                  <ul className="mt-1 flex flex-col gap-2">
                    {source.processedConcepts.map((c) => (
                      <li key={c.term} className="text-body text-default">
                        <span className="text-body-strong text-strong">{c.term}.</span> {c.definition}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {source.processedKeyDetails && source.processedKeyDetails.length > 0 ? (
                <div>
                  <h4 className="text-label text-muted">Detalles importantes</h4>
                  <ul className="mt-1 list-disc pl-5 text-body text-default">
                    {source.processedKeyDetails.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : (
            <InlineAlert variant="info">Esta fuente todavía no tiene análisis. Aparecerá cuando termine de procesarse.</InlineAlert>
          )}

          <section>
            <h3 className="text-h3 text-strong">Contenido</h3>
            <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-control bg-subtle p-3 text-small text-default" tabIndex={0}>
              {source.content}
            </p>
          </section>
        </div>
      ) : null}
    </Dialog>
  );
}
