import {Button, Card, useToast} from '../../ui';
import {REQUEST_NOTE, requestSummary, type HelpRequest} from './helpModel';
import {Icon} from '../../ui/Icon';

/** Support request (UX-06): sent, pending confirmation, never presented as a real booking. */
export function RequestCard({request}: {request: HelpRequest}) {
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(requestSummary(request));
      toast.show({message: 'Solicitud copiada.', variant: 'success'});
    } catch {
      toast.show({message: 'No pude copiar. Selecciona el texto y cópialo.', variant: 'danger'});
    }
  };

  const rows: Array<[string, string]> = [
    ['Tipo', request.type],
    ['Materia', request.subject],
    ['Fecha y hora', request.dateTime],
    ['Lugar o tutor', request.hostOrRoom],
  ];

  return (
    <Card flush className="overflow-hidden border-dashed border-ink/40">
      <p className="bg-warning-tint px-4 py-2 font-mono text-caption uppercase tracking-wide text-strong">Solicitud enviada · pendiente de confirmación</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-4 pt-3 text-small">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-mono text-caption uppercase tracking-wide text-muted">{k}</dt>
            <dd className="border-b border-rule pb-1 text-default">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="px-4 pt-3 text-small text-muted">{REQUEST_NOTE}</p>
      <div className="px-2 pb-2 pt-1">
        <Button variant="ghost" size="sm" leadingIcon={<Icon name="copy" className="size-4" />} onClick={copy}>
          Copiar
        </Button>
      </div>
    </Card>
  );
}
