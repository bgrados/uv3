'use client';

import { useTransition, useState } from 'react';
import { updateMatchScoreAction } from '@/app/actions/fixtures';
import type { Match } from '@/types';

interface MatchScoreControlProps {
  match: Match;
}

const STATUS_LABELS: Record<Match['status'], string> = {
  scheduled: 'Programado',
  playing: 'En curso',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

export function MatchScoreControl({ match }: MatchScoreControlProps) {
  const [isPending, startTransition] = useTransition();
  const [homeScore, setHomeScore] = useState(match.home_score);
  const [awayScore, setAwayScore] = useState(match.away_score);
  const [status, setStatus] = useState<Match['status']>(match.status);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [scoreLog, setScoreLog] = useState<{ time: string; description: string }[]>([]);

  const addLog = (description: string) => {
    const time = new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());
    setScoreLog((prev) => [{ time, description }, ...prev].slice(0, 10));
  };

  const adjustScore = (team: 'home' | 'away', delta: number) => {
    if (team === 'home') {
      const next = Math.max(0, homeScore + delta);
      setHomeScore(next);
      addLog(delta > 0
        ? `⚽ Gol → ${match.home_team?.name ?? 'Local'} (${next} – ${awayScore})`
        : `↩ Ajuste Local (${next} – ${awayScore})`);
    } else {
      const next = Math.max(0, awayScore + delta);
      setAwayScore(next);
      addLog(delta > 0
        ? `⚽ Gol → ${match.away_team?.name ?? 'Visita'} (${homeScore} – ${next})`
        : `↩ Ajuste Visita (${homeScore} – ${next})`);
    }
    setFeedback(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('match_id', match.id);
      formData.set('home_score', String(homeScore));
      formData.set('away_score', String(awayScore));
      formData.set('status', status);

      const result = await updateMatchScoreAction(formData);
      if (result.success) {
        setFeedback({ type: 'success', message: '✅ Marcador guardado correctamente.' });
        addLog(`💾 Guardado: ${homeScore} – ${awayScore} (${STATUS_LABELS[status]})`);
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Error al guardar.' });
      }
    });
  };

  const homeTeamName = match.home_team?.name ?? 'Local';
  const awayTeamName = match.away_team?.name ?? 'Visita';
  const isLive = status === 'playing';

  return (
    <div className="space-y-6">
      {/* Live Indicator */}
      {isLive && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-bold uppercase tracking-widest text-white shadow-md">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-white"></span>
          Partido en Curso
        </div>
      )}

      {/* Score Display */}
      <div className="rounded-2xl bg-gradient-to-br from-uv3-green-dark to-uv3-green p-6 text-white shadow-lg">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Home Team */}
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold text-white/80 leading-tight">{homeTeamName}</p>
            <div className="flex items-center justify-center gap-2">
              <button
                id="home-score-minus"
                type="button"
                onClick={() => adjustScore('home', -1)}
                disabled={homeScore === 0}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl font-bold transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-30"
              >
                −
              </button>
              <span className="min-w-[3ch] text-center text-5xl font-black tabular-nums">
                {homeScore}
              </span>
              <button
                id="home-score-plus"
                type="button"
                onClick={() => adjustScore('home', 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl font-bold transition-colors hover:bg-white/25"
              >
                +
              </button>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Local</p>
          </div>

          {/* Divider */}
          <div className="text-center">
            <span className="text-3xl font-black text-white/40">–</span>
          </div>

          {/* Away Team */}
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold text-white/80 leading-tight">{awayTeamName}</p>
            <div className="flex items-center justify-center gap-2">
              <button
                id="away-score-minus"
                type="button"
                onClick={() => adjustScore('away', -1)}
                disabled={awayScore === 0}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl font-bold transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-30"
              >
                −
              </button>
              <span className="min-w-[3ch] text-center text-5xl font-black tabular-nums">
                {awayScore}
              </span>
              <button
                id="away-score-plus"
                type="button"
                onClick={() => adjustScore('away', 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl font-bold transition-colors hover:bg-white/25"
              >
                +
              </button>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Visita</p>
          </div>
        </div>
      </div>

      {/* Status Selector */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-700">Estado del partido</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(['scheduled', 'playing', 'completed', 'cancelled'] as const).map((s) => (
            <button
              id={`status-${s}`}
              key={s}
              type="button"
              onClick={() => { setStatus(s); setFeedback(null); }}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                status === s
                  ? s === 'playing'
                    ? 'border-red-500 bg-red-500 text-white shadow-sm'
                    : 'border-uv3-green-dark bg-uv3-green-dark text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-uv3-green hover:text-uv3-green-dark'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Save Button */}
      <button
        id="save-score"
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full rounded-xl bg-uv3-green-dark px-6 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-uv3-green hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Guardando...
          </span>
        ) : (
          '💾 Guardar Marcador'
        )}
      </button>

      {/* Score Log */}
      {scoreLog.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">
            Registro de cambios
          </p>
          <ul className="space-y-1.5">
            {scoreLog.map((entry, i) => (
              <li key={i} className="flex items-center gap-3 text-xs text-stone-600">
                <span className="font-mono text-stone-400 tabular-nums">{entry.time}</span>
                <span>{entry.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
