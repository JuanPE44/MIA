import {useId, useRef, useState, type FormEvent} from 'react';
import {useAppState} from '../../app/AppStateContext';
import {PLAN_LABELS, type BillingPeriod, type PlanTier} from '../../config/plans';
import {Button, Dialog, InlineAlert, TextField} from '../../ui';
import {priceLabel} from './planCopy';

/** Standard test card; never validated or sent anywhere. */
const DEMO_CARD = {number: '4242 4242 4242 4242', expiry: '12/30', cvc: '123'} as const;

interface CheckoutDialogProps {
  tier: PlanTier;
  period: BillingPeriod;
  onClose: () => void;
  /** Applies the plan (server call). Rejects on failure. */
  onConfirm: () => Promise<void>;
}

/**
 * Fake checkout. The card fields are never validated, sent or stored: they only
 * mimic a real payment step. Mounted only while open.
 */
export function CheckoutDialog({tier, period, onClose, onConfirm}: CheckoutDialogProps) {
  const formId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const {studentProfile} = useAppState();
  const cardName = studentProfile.name.trim() || 'Estudiante MIA';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch {
      setError('No se pudo cambiar tu plan. Inténtalo de nuevo.');
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      dismissible={!busy}
      initialFocusRef={confirmRef}
      title={`Obtener plan ${PLAN_LABELS[tier]}`}
      description={priceLabel(tier, tier === 'pro' ? period : 'monthly')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button ref={confirmRef} type="submit" form={formId} variant="primary" loading={busy}>
            Confirmar pago
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <InlineAlert variant="info">
          Pago simulado: no se procesa ningún cobro y los datos de la tarjeta no se guardan.
        </InlineAlert>
        {/* Prefilled demo card: the student only has to confirm. */}
        <TextField label="Nombre en la tarjeta" defaultValue={cardName} autoComplete="off" />
        <TextField
          label="Número de tarjeta"
          inputMode="numeric"
          defaultValue={DEMO_CARD.number}
          placeholder="1234 5678 9012 3456"
          autoComplete="off"
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Vencimiento" defaultValue={DEMO_CARD.expiry} placeholder="MM/AA" autoComplete="off" />
          <TextField label="CVC" inputMode="numeric" defaultValue={DEMO_CARD.cvc} placeholder="123" autoComplete="off" />
        </div>
        {error ? (
          <InlineAlert variant="danger" live>
            {error}
          </InlineAlert>
        ) : null}
      </form>
    </Dialog>
  );
}
