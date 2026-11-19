import {useNavigate} from 'react-router';
import type {FeatureKey} from '../../config/plans';
import {FEATURE_LABELS} from '../../config/plans';
import {paths} from '../../app/routes';
import {Button, Card, EmptyState} from '../../ui';
import {Icon} from '../../ui/Icon';

interface LockedFeatureProps {
  feature: FeatureKey;
  /** Short sentence about what the feature gives the student. */
  description?: string;
  className?: string;
}

/** Clean locked state shown instead of a screen the current plan does not include. */
export function LockedFeature({feature, description, className}: LockedFeatureProps) {
  const navigate = useNavigate();
  return (
    <Card className={className}>
      <EmptyState
        icon={<Icon name="lock" />}
        title={`${FEATURE_LABELS[feature]} no está en tu plan`}
        description={description ?? 'Mejora tu plan para usar esta función.'}
        action={
          <Button variant="primary" onClick={() => navigate(paths.plans(feature))}>
            Ver planes
          </Button>
        }
        headingLevel={3}
      />
    </Card>
  );
}
