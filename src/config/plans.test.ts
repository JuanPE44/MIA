import {describe, expect, it} from 'vitest';
import {PLAN_CONFIG, isLimitReached, periodStart, planHasFeature, QUOTAS} from './plans';

describe('plans config', () => {
  it('gates Pro-only features', () => {
    expect(planHasFeature('free', 'googleSearch')).toBe(false);
    expect(planHasFeature('extended', 'reinforcementRecs')).toBe(true);
    expect(planHasFeature('pro', 'studyMetrics')).toBe(true);
  });

  it('treats null as unlimited and 0 as unavailable', () => {
    expect(isLimitReached(null, 1000)).toBe(false);
    expect(isLimitReached(30, 29)).toBe(false);
    expect(isLimitReached(30, 30)).toBe(true);
    expect(QUOTAS.podcasts.limit('free')).toBe(0);
    expect(PLAN_CONFIG.pro.limits.sourcesPerNotebook).toBeNull();
  });

  it('computes quota period starts in UTC (weeks start on Monday)', () => {
    const wednesday = new Date('2026-11-18T15:00:00Z');
    expect(periodStart('day', wednesday)).toBe('2026-11-18');
    expect(periodStart('week', wednesday)).toBe('2026-11-16');
    expect(periodStart('week', new Date('2026-11-22T23:00:00Z'))).toBe('2026-11-16');
  });
});
