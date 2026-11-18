/** Realistic response latency for the heuristic branches (never used with the real model). */
export function simulatedDelay(kind: 'normal' | 'artifact' = 'normal'): Promise<void> {
  const [min, max] = kind === 'artifact' ? [1500, 2500] : [600, 1500];
  const ms = Math.round(min + Math.random() * (max - min));
  return new Promise((resolve) => setTimeout(resolve, ms));
}
