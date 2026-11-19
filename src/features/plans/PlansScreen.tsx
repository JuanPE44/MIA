import {useState} from 'react';
import {useSearchParams} from 'react-router';
import {useAppState} from '../../app/AppStateContext';
import {
  PLAN_LABELS,
  PLAN_PRICES,
  PLAN_TIERS,
  cheapestTierFor,
  isPlanNeed,
  type BillingPeriod, type PlanTier,
} from '../../config/plans';
import {Button, Card, Highlight, Page, PageHeader, SegmentedControl, StatusBadge, useToast} from '../../ui';
import {Icon} from '../../ui/Icon';
import {CheckoutDialog} from './CheckoutDialog';
import {NEED_LABELS, formatUsd, planHighlights} from './planCopy';

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
  const [searchParams] = useSearchParams();
  const needParam = searchParams.get('necesito');
  const need = isPlanNeed(needParam) ? needParam : null;
  const needTier = need ? cheapestTierFor(need) : null;
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
      {need && needTier && needTier !== plan ? (
        <p
          data-testid="plan-need"
          className="max-w-reading rounded-control border border-ink bg-highlight/40 px-4 py-3 text-body text-strong"
        >
          Para usar <strong>{NEED_LABELS[need]}</strong> necesitas el plan <strong>{PLAN_LABELS[needTier]}</strong>.
        </p>
      ) : null}
      <p className="max-w-reading text-body text-muted">
        Cambia de plan cuando quieras. Por ahora el pago es simulado: no se cobra nada.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl<BillingPeriod>
          aria-label="Facturación del plan Pro"
          value={period}
          onValueChange={setPeriod}
          options={PERIOD_OPTIONS}
          className="self-start"
        />
        <span className="text-small text-muted">Aplica al plan Pro</span>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        {PLAN_TIERS.map((tier) => {
          const current = tier === plan;
          const perMonth = tier === 'pro' && period === 'annual' ? PLAN_PRICES.pro.annual / 12 : null;
          return (
            <Card key={tier} selected={current} className={`flex flex-col gap-4${needTier === tier && !current ? ' ring-2 ring-ink' : ''}`} aria-label={`Plan ${PLAN_LABELS[tier]}`}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-h2 text-strong">{PLAN_LABELS[tier]}</h2>
                {current ? (
                  <StatusBadge variant="success">Plan actual</StatusBadge>
                ) : needTier === tier ? (
                  <StatusBadge variant="info">Desbloquea {NEED_LABELS[need!]}</StatusBadge>
                ) : tier === 'pro' ? (
                  <StatusBadge variant="info">Más completo</StatusBadge>
                ) : null}
              </div>
              <div>
                <p className="flex flex-wrap items-baseline gap-x-2 whitespace-nowrap">
                  <span className="font-mono text-display font-semibold text-strong tabular-nums">
                    {tier === 'free' ? '0 US$' : formatUsd(PLAN_PRICES[tier][tier === 'pro' ? period : 'monthly'])}
                  </span>
                  <span className="font-mono text-small text-muted">
                    {tier === 'free' ? 'para siempre' : tier === 'pro' && period === 'annual' ? '/ año' : '/ mes'}
                  </span>
                </p>
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
                variant={current || tier === 'free' ? 'secondary' : 'primary'}
                fullWidth
                disabled={current}
                loading={switching === tier}
                onClick={() => void choose(tier)}
              >
                {current ? 'Tu plan actual' : tier === 'free' ? 'Cambiar a Gratis' : `Elegir ${PLAN_LABELS[tier]}`}
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
