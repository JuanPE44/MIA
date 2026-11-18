import {useState} from 'react';
import {useAppState} from '../../app/AppStateContext';
import {PLAN_LABELS, PLAN_PRICES, PLAN_TIERS, type BillingPeriod, type PlanTier} from '../../config/plans';
import {Button, Card, Highlight, Page, PageHeader, SegmentedControl, StatusBadge, useToast} from '../../ui';
import {Icon} from '../../ui/Icon';
import {CheckoutDialog} from './CheckoutDialog';
import {formatUsd, planHighlights, priceLabel} from './planCopy';

const PERIOD_OPTIONS = [
  {value: 'monthly' as const, label: 'Mensual'},
  {value: 'annual' as const, label: 'Anual (33% menos)'},
];

const TAGLINES: Record<PlanTier, string> = {
  free: 'Para empezar a estudiar con tus propios materiales.',
  extended: 'Más espacio, más infografías y podcasts.',
  pro: 'Todas las funciones, sin límites prácticos.',
};

/** "Planes" (/planes): compare the three tiers and switch plan through a simulated checkout. */
export function PlansScreen() {
  const toast = useToast();
  const {plan, handleChangePlan} = useAppState();
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [checkoutTier, setCheckoutTier] = useState<PlanTier | null>(null);
  const [switching, setSwitching] = useState<PlanTier | null>(null);

  // Free has no payment step: it is applied directly.
  const choose = async (tier: PlanTier) => {
    if (tier === 'free') {
      setSwitching(tier);
      try {
        await handleChangePlan(tier);
        toast.show({variant: 'success', message: `Ahora estás en el plan ${PLAN_LABELS[tier]}.`});
      } catch {
        toast.show({variant: 'danger', message: 'No se pudo cambiar tu plan. Inténtalo de nuevo.'});
      } finally {
        setSwitching(null);
      }
      return;
    }
    setCheckoutTier(tier);
  };

  return (
    <Page className="flex flex-col gap-8 pb-16">
      <PageHeader title={<>Elige tu <Highlight trigger="mount">plan</Highlight></>} />
      <p className="max-w-reading text-body text-muted">
        Cambia de plan cuando quieras. Por ahora el pago es simulado: no se cobra nada.
      </p>

      <SegmentedControl<BillingPeriod>
        aria-label="Facturación del plan Pro"
        value={period}
        onValueChange={setPeriod}
        options={PERIOD_OPTIONS}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_TIERS.map((tier) => {
          const current = tier === plan;
          const perMonth = tier === 'pro' && period === 'annual' ? PLAN_PRICES.pro.annual / 12 : null;
          return (
            <Card key={tier} selected={current} className="flex flex-col gap-4" aria-label={`Plan ${PLAN_LABELS[tier]}`}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-h2 text-strong">{PLAN_LABELS[tier]}</h2>
                {current ? <StatusBadge variant="success">Plan actual</StatusBadge> : null}
              </div>
              <div>
                <p className="font-mono text-display font-semibold text-strong">{priceLabel(tier, period)}</p>
                {perMonth ? <p className="text-small text-muted">Equivale a {formatUsd(perMonth)} al mes</p> : null}
              </div>
              <p className="text-body text-muted">{TAGLINES[tier]}</p>
              <ul className="flex flex-1 flex-col gap-2">
                {planHighlights(tier).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-body text-default">
                    <Icon name="check" weight="bold" className="mt-1 size-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                variant={current ? 'secondary' : 'primary'}
                fullWidth
                disabled={current}
                loading={switching === tier}
                onClick={() => void choose(tier)}
              >
                {current ? 'Tu plan actual' : 'Obtener plan'}
              </Button>
            </Card>
          );
        })}
      </div>

      {checkoutTier ? (
        <CheckoutDialog
          tier={checkoutTier}
          period={period}
          onClose={() => setCheckoutTier(null)}
          onConfirm={async () => {
            await handleChangePlan(checkoutTier);
            toast.show({variant: 'success', message: `Listo: ahora estás en el plan ${PLAN_LABELS[checkoutTier]}.`});
          }}
        />
      ) : null}
    </Page>
  );
}
