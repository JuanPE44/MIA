import {Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import type {WeekDay} from './progressModel';

interface WeeklyChartProps {
  week: WeekDay[];
  goal: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{payload: WeekDay}>;
}

function ChartTooltip({active, payload, goal}: TooltipProps & {goal: number}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-control border border-rule bg-surface-raised p-3 text-small text-default shadow-offset">
      <p className="font-display text-label text-strong">{d.fullDay}</p>
      <p className="font-mono text-caption tabular-nums">
        {d.minutes} min · {d.sessions} {d.sessions === 1 ? 'sesión' : 'sesiones'}
      </p>
      <p className={d.minutes >= goal ? 'text-success' : 'text-muted'}>
        {d.minutes >= goal ? 'Meta cumplida' : `Faltaron ${goal - d.minutes} min para la meta`}
      </p>
    </div>
  );
}

const TICK = {fontFamily: 'var(--mia-font-mono)', fontSize: 12, fill: 'var(--mia-text-muted)'} as const;

/**
 * Weekly bar chart. Ink-blue bars, highlighter for the best day, rule-colored
 * grid and mono ticks, all through `--mia-*` variables (works in dark mode).
 * A visually hidden table carries the same data for assistive technology.
 */
export function WeeklyChart({week, goal}: WeeklyChartProps) {
  const max = Math.max(goal, ...week.map((d) => d.minutes));
  const top = Math.ceil((max + 10) / 10) * 10;
  const best = Math.max(...week.map((d) => d.minutes));
  const bestIndex = best > 0 ? week.findIndex((d) => d.minutes === best) : -1;

  return (
    <div>
      <div aria-hidden className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={week} margin={{top: 12, right: 8, left: 0, bottom: 0}} accessibilityLayer={false}>
            <CartesianGrid stroke="var(--mia-rule)" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={{stroke: 'var(--mia-rule)'}} tick={TICK} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} domain={[0, top]} width={32} tick={TICK} />
            <Tooltip cursor={{fill: 'var(--mia-bg-subtle)'}} content={<ChartTooltip goal={goal} />} />
            <ReferenceLine y={goal} stroke="var(--mia-ink)" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Bar dataKey="minutes" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {week.map((d, i) => (
                <Cell
                  key={d.day + d.date}
                  fill={i === bestIndex ? 'var(--mia-highlight)' : 'var(--mia-primary)'}
                  stroke={i === bestIndex ? 'var(--mia-ink)' : 'none'}
                  strokeWidth={i === bestIndex ? 1.5 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul aria-hidden className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-caption text-muted">
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-small bg-primary" /> Minutos de estudio (eje en min)
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-small border border-ink bg-highlight" /> Mejor día
        </li>
        <li className="flex items-center gap-2">
          <span className="h-0 w-4 border-t-2 border-dashed border-ink/60" /> Meta ({goal} min)
        </li>
      </ul>

      <div className="sr-only">
        <table>
        <caption>Minutos de estudio de los últimos 7 días. Meta diaria: {goal} minutos.</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Minutos</th>
            <th scope="col">Sesiones</th>
            <th scope="col">Meta</th>
          </tr>
        </thead>
        <tbody>
          {week.map((d) => (
            <tr key={d.day + d.date}>
              <th scope="row">{d.fullDay}</th>
              <td>{d.minutes}</td>
              <td>{d.sessions}</td>
              <td>{d.minutes >= goal ? 'Cumplida' : 'No cumplida'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
