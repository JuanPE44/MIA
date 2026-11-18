import {useNavigate} from 'react-router';
import {useAppState} from '../../app/AppStateContext';
import {paths} from '../../app/routes';
import {PLAN_LABELS} from '../../config/plans';
import {Button, StatusBadge} from '../../ui';
import {planHighlights} from '../plans/planCopy';

/** Plan subsection of the account page: current plan badge, what it includes and a link to /planes. */
export function PlanPanel() {
  const navigate = useNavigate();
  const {plan} = useAppState();
  return (
    <section aria-labelledby="account-plan" className="space-y-3 rounded-card border border-rule bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="account-plan" className="text-h2 text-strong">
          Plan
        </h2>
        <StatusBadge variant={plan === 'free' ? 'neutral' : 'success'}>{PLAN_LABELS[plan]}</StatusBadge>
      </div>
      <ul className="space-y-1 text-body text-default">
        {planHighlights(plan).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <Button variant="secondary" onClick={() => navigate(paths.plans())}>
        {plan === 'pro' ? 'Ver planes' : 'Mejorar plan'}
      </Button>
    </section>
  );
}
