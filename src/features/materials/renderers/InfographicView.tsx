import {Highlight, Reveal, RevealItem} from '../../../ui';

interface InfographicData {
  highlightStat?: {number: string; label: string};
  pillars?: Array<{title: string; desc: string; color?: string}>;
}

/** Infographic: a highlighted statistic and numbered pillars. */
export function InfographicView({data}: {data: InfographicData}) {
  const pillars = Array.isArray(data.pillars) ? data.pillars : [];
  return (
    <div className="w-full max-w-reading space-y-5">
      {data.highlightStat ? (
        <div className="rounded-card border border-rule bg-surface p-6 text-center">
          <p className="font-display text-display text-strong">
            <Highlight trigger="mount">{data.highlightStat.number}</Highlight>
          </p>
          <p className="mx-auto mt-3 max-w-narrow text-label text-default">{data.highlightStat.label}</p>
        </div>
      ) : null}

      {pillars.length > 0 ? (
        <Reveal as="ul" className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {pillars.map((pillar, i) => (
            <RevealItem as="li" key={i} className="rounded-card border border-rule bg-surface p-5">
              <span
                aria-hidden
                className="mb-3 flex size-8 items-center justify-center rounded-small bg-highlight font-mono text-label text-highlight-ink"
              >
                {i + 1}
              </span>
              <h3 className="font-display text-h3 text-strong">{pillar.title}</h3>
              <p className="mt-1 text-small text-default">{pillar.desc}</p>
            </RevealItem>
          ))}
        </Reveal>
      ) : null}
    </div>
  );
}
