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
    <div className="rounded-control border border-hairline bg-surface-raised p-3 text-small text-default shadow-elevation-2">
      <p className="text-label text-strong">{d.fullDay}</p>
      <p>
        {d.minutes} min · {d.sessions} {d.sessions === 1 ? 'sesión' : 'sesiones'}
      </p>
      <p className={d.minutes >= goal ? 'text-success' : 'text-muted'}>
        {d.minutes >= goal ? 'Meta cumplida' : `Faltaron ${goal - d.minutes} min para la meta`}
      </p>
    </div>
  );
}

/**
 * Weekly bar chart (spec 6.4). Colors come from token utilities; a visually
 * hidden table carries the same data for assistive technology.
 */
export function WeeklyChart({week, goal}: WeeklyChartProps) {
  const max = Math.max(goal, ...week.map((d) => d.minutes));
  const top = Math.ceil((max + 10) / 10) * 10;

  return (
    <div>
      <div
        aria-hidden
        className={
          'h-64 w-full sm:h-72 ' +
          '[&_.recharts-cartesian-axis-tick-value]:fill-muted [&_.recharts-cartesian-axis-tick-value]:text-caption ' +
          '[&_.recharts-cartesian-grid_line]:stroke-hairline ' +
          '[&_.recharts-reference-line-line]:stroke-muted ' +
          '[&_.recharts-cartesian-axis-line]:stroke-hairline'
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={week} margin={{top: 12, right: 8, left: -16, bottom: 0}} accessibilityLayer={false}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tickLine={false} />
            <YAxis unit=" m" tickLine={false} axisLine={false} domain={[0, top]} width={48} />
            <Tooltip cursor={{className: 'fill-subtle'}} content={<ChartTooltip goal={goal} />} />
            <ReferenceLine y={goal} strokeDasharray="4 4" />
            <Bar dataKey="minutes" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {week.map((d) => (
                <Cell key={d.day + d.date} className={d.minutes >= goal ? 'fill-success' : 'fill-primary'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul aria-hidden className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-small text-muted">
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-small bg-primary" /> Minutos de estudio
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-small bg-success" /> Meta cumplida
        </li>
        <li className="flex items-center gap-2">
          <span className="h-0 w-4 border-t-2 border-dashed border-muted" /> Meta ({goal} min)
        </li>
      </ul>

      <table className="sr-only">
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
  );
}
