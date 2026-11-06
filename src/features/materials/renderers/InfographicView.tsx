interface InfographicData {
  highlightStat?: {number: string; label: string};
  pillars?: Array<{title: string; desc: string; color?: string}>;
}

/** Infographic: a highlighted statistic and numbered pillars. */
export function InfographicView({data}: {data: InfographicData}) {
  const pillars = Array.isArray(data.pillars) ? data.pillars : [];
  return (
    <div className="mx-auto w-full max-w-[720px] space-y-5">
      {data.highlightStat ? (
        <div className="rounded-card bg-primary p-6 text-center text-on-primary">
          <p className="text-display">{data.highlightStat.number}</p>
          <p className="mx-auto mt-1 max-w-sm text-label">{data.highlightStat.label}</p>
        </div>
      ) : null}

      {pillars.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {pillars.map((pillar, i) => (
            <li key={i} className="rounded-card border border-hairline bg-surface p-5">
              <span
                aria-hidden
                className="mb-3 flex size-8 items-center justify-center rounded-control bg-primary-tint text-label text-primary-on-tint"
              >
                {i + 1}
              </span>
              <h3 className="text-body-strong text-strong">{pillar.title}</h3>
              <p className="mt-1 text-small text-default">{pillar.desc}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
