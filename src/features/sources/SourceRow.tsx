import type {SourceItem} from '../../types';
import {Button, InlineAlert, Menu, StatusBadge, Switch, type MenuItem} from '../../ui';
import {TYPE_TILE, sourceMeta, typeIcon} from './sourceModel';
import {Icon} from '../../ui/Icon';

export type SourceStatus = 'analyzing' | 'ready' | 'error';

interface SourceRowProps {
  source: SourceItem;
  status: SourceStatus;
  onToggle: () => void;
  onViewAnalysis: () => void;
  onAsk: () => void;
  onDelete: () => void;
  onRetry: () => void;
}

/** One source in the Fuentes list (spec §4.4): tile, title/meta, status, grounding switch, menu. */
export function SourceRow({source, status, onToggle, onViewAnalysis, onAsk, onDelete, onRetry}: SourceRowProps) {
  const selected = source.selectedForChat !== false;
  const items: MenuItem[] = [
    {id: 'view', label: 'Ver análisis', icon: <Icon name="view" />, onSelect: onViewAnalysis},
    {id: 'ask', label: 'Preguntar en el chat', icon: <Icon name="chat" />, onSelect: onAsk},
    {id: 'delete', label: 'Eliminar', icon: <Icon name="delete" />, onSelect: onDelete, danger: true},
  ];

  return (
    <li className="px-3 py-2 sm:px-4">
      <div className="flex min-h-16 items-center gap-3">
        <span
          aria-hidden
          className={`inline-flex size-10 shrink-0 items-center justify-center rounded-control text-strong ${TYPE_TILE[source.type]}`}
        >
          {typeIcon(source.type)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-strong text-strong">{source.title}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-small text-muted">{sourceMeta(source)}</p>
            {status === 'analyzing' ? (
              <StatusBadge variant="info" loading>
                Analizando…
              </StatusBadge>
            ) : status === 'error' ? (
              <StatusBadge variant="danger">Error</StatusBadge>
            ) : (
              <StatusBadge variant="success">Lista</StatusBadge>
            )}
          </div>
        </div>
        <label className="flex shrink-0 cursor-pointer flex-col items-center gap-0.5 pointer-coarse:min-h-11 pointer-coarse:justify-center sm:flex-row sm:gap-2">
          <Switch
            aria-label={`Usar «${source.title}» en el chat`}
            checked={selected}
            onCheckedChange={onToggle}
            disabled={status === 'analyzing'}
            disabledReason="Disponible cuando termine el análisis"
          />
          <span aria-hidden className="text-caption text-muted sm:text-small">
            <span className="sm:hidden">Chat</span>
            <span className="hidden sm:inline">Usar en el chat</span>
          </span>
        </label>
        <Menu label={`Opciones de ${source.title}`} items={items} />
      </div>
      {status === 'error' ? (
        <InlineAlert
          variant="danger"
          live
          className="mb-2"
          actions={
            <Button size="sm" variant="secondary" onClick={onRetry}>
              Reintentar
            </Button>
          }
        >
          No se pudo analizar esta fuente. Puedes seguir usándola en el chat o reintentar el análisis.
        </InlineAlert>
      ) : null}
    </li>
  );
}
