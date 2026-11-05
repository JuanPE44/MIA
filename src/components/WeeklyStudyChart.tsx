import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Plus,
  Flame,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { UserStudyStats, DailyStudyLog } from '../types';

interface WeeklyStudyChartProps {
  stats: UserStudyStats;
  onUpdateStats: (newStats: Partial<UserStudyStats>) => void;
  notebookTitle?: string;
}

export const WeeklyStudyChart: React.FC<WeeklyStudyChartProps> = ({
  stats,
  onUpdateStats,
  notebookTitle
}) => {
  const [targetGoal, setTargetGoal] = useState<number>(45);
  const [selectedDay, setSelectedDay] = useState<string | null>('Dom');
  const [filterMode, setFilterMode] = useState<'all' | 'aboveGoal'>('all');

  // Base 7 days of the week, with the last day matching stats.focusMinutesToday
  const defaultWeekLogs: DailyStudyLog[] = useMemo(() => {
    return (
      stats.weeklyLogs || [
        { day: 'Lun', fullDay: 'Lunes', date: 'Lun 29', minutes: 45, targetMinutes: targetGoal, sessions: 2 },
        { day: 'Mar', fullDay: 'Martes', date: 'Mar 30', minutes: 60, targetMinutes: targetGoal, sessions: 3 },
        { day: 'Mié', fullDay: 'Miércoles', date: 'Mié 01', minutes: 35, targetMinutes: targetGoal, sessions: 1 },
        { day: 'Jue', fullDay: 'Jueves', date: 'Jue 02', minutes: 50, targetMinutes: targetGoal, sessions: 2 },
        { day: 'Vie', fullDay: 'Viernes', date: 'Vie 03', minutes: 75, targetMinutes: targetGoal, sessions: 3 },
        { day: 'Sáb', fullDay: 'Sábado', date: 'Sáb 04', minutes: 30, targetMinutes: targetGoal, sessions: 1 },
        { day: 'Dom', fullDay: 'Domingo (Hoy)', date: 'Hoy', minutes: stats.focusMinutesToday, targetMinutes: targetGoal, sessions: Math.max(1, stats.sessionsCompleted) }
      ]
    );
  }, [stats.weeklyLogs, stats.focusMinutesToday, stats.sessionsCompleted, targetGoal]);

  // Merge today's focus minutes dynamically into the last item
  const chartData = useMemo(() => {
    return defaultWeekLogs.map((item, index) => {
      const isToday = index === defaultWeekLogs.length - 1;
      const minutes = isToday ? stats.focusMinutesToday : item.minutes;
      return {
        ...item,
        minutes,
        targetMinutes: targetGoal,
        isToday,
        metGoal: minutes >= targetGoal,
        pct: Math.round((minutes / targetGoal) * 100)
      };
    });
  }, [defaultWeekLogs, stats.focusMinutesToday, targetGoal]);

  // Summary statistics calculation
  const totalWeeklyMinutes = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.minutes, 0);
  }, [chartData]);

  const dailyAverage = useMemo(() => {
    return Math.round(totalWeeklyMinutes / chartData.length);
  }, [totalWeeklyMinutes, chartData.length]);

  const daysMeetingGoal = useMemo(() => {
    return chartData.filter((d) => d.minutes >= targetGoal).length;
  }, [chartData, targetGoal]);

  const bestDay = useMemo(() => {
    return [...chartData].sort((a, b) => b.minutes - a.minutes)[0];
  }, [chartData]);

  // Quick action: Log additional study minutes to stats
  const handleQuickAddMinutes = (mins: number) => {
    const newToday = stats.focusMinutesToday + mins;
    const newHours = Math.round((stats.totalFocusHours + mins / 60) * 10) / 10;
    const newSessions = stats.sessionsCompleted + 1;
    const newXp = stats.xpPoints + mins * 2;

    const updatedLogs = chartData.map((d) =>
      d.isToday
        ? {
            ...d,
            minutes: newToday,
            sessions: d.sessions + 1
          }
        : d
    );

    onUpdateStats({
      focusMinutesToday: newToday,
      totalFocusHours: newHours,
      sessionsCompleted: newSessions,
      xpPoints: newXp,
      weeklyLogs: updatedLogs
    });
  };

  const activeDayData = useMemo(() => {
    if (!selectedDay) return chartData[chartData.length - 1];
    return chartData.find((d) => d.day === selectedDay) || chartData[chartData.length - 1];
  }, [chartData, selectedDay]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl p-6 shadow-sm space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Progreso Semanal de Estudio
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                Última Semana
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Registro diario de minutos dedicados {notebookTitle ? `al cuaderno "${notebookTitle}"` : 'a tu aprendizaje'}.
            </p>
          </div>
        </div>

        {/* Goal Selector & Quick Log Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Meta:</span>
            <select
              value={targetGoal}
              onChange={(e) => setTargetGoal(Number(e.target.value))}
              className="bg-transparent font-black text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer"
            >
              <option value={30} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">30 min/día</option>
              <option value={45} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">45 min/día</option>
              <option value={60} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">60 min/día</option>
              <option value={90} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">90 min/día</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleQuickAddMinutes(15)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
              title="Registrar 15 min de estudio rápido"
            >
              <Plus className="w-3 h-3 text-indigo-600" />
              <span>+15m</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddMinutes(25)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              title="Completar bloque de 25 min"
            >
              <Zap className="w-3 h-3 fill-white" />
              <span>+25m Pomodoro</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Semana</span>
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{totalWeeklyMinutes}</span>
            <span className="text-xs font-bold text-slate-500">min</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            ≈ {(totalWeeklyMinutes / 60).toFixed(1)} horas acumuladas
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Promedio Diario</span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-purple-700">{dailyAverage}</span>
            <span className="text-xs font-bold text-slate-500">min/día</span>
          </div>
          <p className="text-[10px] text-purple-600 font-semibold mt-0.5">
            {dailyAverage >= targetGoal ? '🔥 ¡Supera tu meta diaria!' : 'Cerca del objetivo fijado'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cumplimiento</span>
            <Target className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-600">{daysMeetingGoal}</span>
            <span className="text-xs font-bold text-slate-500">/ 7 días</span>
          </div>
          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
            {Math.round((daysMeetingGoal / 7) * 100)}% de días en objetivo
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Racha Activa</span>
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600">{stats.currentStreakDays}</span>
            <span className="text-xs font-bold text-slate-500">días</span>
          </div>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">
            Día pico: {bestDay?.day} ({bestDay?.minutes}m)
          </p>
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-500 font-bold">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-indigo-600"></span>
            <span>Minutos de estudio</span>
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-500 ml-2"></span>
            <span>Hoy en curso</span>
            <span className="inline-block w-4 h-0.5 bg-emerald-500 border-dashed ml-2"></span>
            <span className="text-emerald-700">Meta ({targetGoal} min)</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Haz clic en una barra para ver detalles</span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 15, left: -15, bottom: 5 }}
              onClick={(state) => {
                if (state && state.activeLabel) {
                  setSelectedDay(state.activeLabel as string);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={({ x, y, payload }) => {
                  const isSelected = payload.value === selectedDay;
                  const isToday = payload.value === 'Dom';
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={14}
                        textAnchor="middle"
                        fill={isSelected ? '#4f46e5' : isToday ? '#d97706' : '#64748b'}
                        fontSize={12}
                        fontWeight={isSelected || isToday ? 'bold' : 'normal'}
                      >
                        {payload.value}
                      </text>
                    </g>
                  );
                }}
              />
              <YAxis
                unit="m"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                domain={[0, (dataMax: number) => Math.max(targetGoal + 20, Math.ceil((dataMax + 10) / 10) * 10)]}
              />
              <Tooltip
                cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as (typeof chartData)[0];
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[170px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                          <span className="font-black text-indigo-300">
                            {data.fullDay}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {data.date}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-black pt-0.5">
                          <span>Tiempo:</span>
                          <span className="text-amber-400">{data.minutes} minutos</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span>Sesiones:</span>
                          <span>{data.sessions} bloques</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                          <span>Objetivo:</span>
                          <span
                            className={`font-bold ${
                              data.metGoal ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {data.pct}% ({data.metGoal ? 'Cumplido ✅' : 'Faltó'})
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={targetGoal}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: `Meta: ${targetGoal}m`,
                  position: 'top',
                  fill: '#059669',
                  fontSize: 10,
                  fontWeight: 700
                }}
              />
              <Bar
                dataKey="minutes"
                radius={[8, 8, 2, 2]}
                animationDuration={900}
              >
                {chartData.map((entry) => {
                  const isSelected = selectedDay === entry.day;
                  let fill = '#6366f1'; // Default Indigo

                  if (entry.isToday) {
                    fill = isSelected ? '#f59e0b' : '#fbbf24'; // Amber for Today
                  } else if (isSelected) {
                    fill = '#4338ca'; // Dark Indigo when clicked
                  } else if (entry.metGoal) {
                    fill = '#818cf8'; // Soft Indigo for goal met
                  } else {
                    fill = '#cbd5e1'; // Slate for lower minutes
                  }

                  return (
                    <Cell
                      key={`cell-${entry.day}`}
                      fill={fill}
                      className="cursor-pointer transition-all duration-200 hover:opacity-90"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selected Day Inspector / Detail Card */}
      {activeDayData && (
        <div className="p-4 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-indigo-200 flex items-center justify-center font-black text-indigo-700 shadow-xs">
              {activeDayData.day}
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-sm">
                Detalle de {activeDayData.fullDay}{' '}
                {activeDayData.isToday && (
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full ml-1.5">
                    Sesión de Hoy
                  </span>
                )}
              </p>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Registró <strong>{activeDayData.minutes} minutos</strong> en {activeDayData.sessions} sesiones de concentración.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Progreso vs Meta</span>
              <span
                className={`font-black text-xs ${
                  activeDayData.metGoal ? 'text-emerald-700' : 'text-slate-700'
                }`}
              >
                {activeDayData.pct}% del objetivo ({activeDayData.minutes}/{targetGoal}m)
              </span>
            </div>

            {activeDayData.metGoal ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Meta Lograda</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleQuickAddMinutes(targetGoal - activeDayData.minutes > 0 ? targetGoal - activeDayData.minutes : 15)}
                className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] transition shadow-xs cursor-pointer"
              >
                Completar Meta (+{Math.max(15, targetGoal - activeDayData.minutes)}m)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
