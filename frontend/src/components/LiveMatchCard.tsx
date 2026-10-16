import type { Match } from '@/types';

const STATUS_CONFIG = {
  scheduled: { label: 'Programado', className: 'bg-gray-100 text-gray-700' },
  playing: { label: '🔴 EN VIVO', className: 'bg-red-100 text-red-700 animate-pulse' },
  completed: { label: 'Finalizado', className: 'bg-stone-200 text-stone-700' },
  cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-400 line-through' },
} as const;

interface LiveMatchCardProps {
  match: Match;
  showTournament?: boolean;
  tournamentName?: string;
}

export function LiveMatchCard({ match, showTournament, tournamentName }: LiveMatchCardProps) {
  const status = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.scheduled;
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'playing';

  const homeTeamName = match.home_team?.name ?? 'Local';
  const awayTeamName = match.away_team?.name ?? 'Visita';
  const venueName = match.venue?.name ?? 'Cancha Principal';

  const formattedDate = match.date_time
    ? new Intl.DateTimeFormat('es-PE', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(match.date_time))
    : 'Fecha por definir';

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isLive
          ? 'border-red-300 bg-red-50 shadow-md shadow-red-100'
          : isCompleted
          ? 'border-stone-200 bg-stone-50/50'
          : 'border-uv3-green-dark/15 bg-white shadow-sm hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Jornada {match.round}
          </span>
          {showTournament && tournamentName && (
            <span className="text-[10px] text-stone-400">· {tournamentName}</span>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Score Row */}
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex-1 text-sm font-bold ${
            isCompleted && match.home_score > match.away_score
              ? 'text-uv3-green-dark'
              : 'text-stone-800'
          }`}
        >
          {homeTeamName}
        </span>

        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono font-bold text-lg ${
            isLive
              ? 'bg-red-600 text-white shadow-sm'
              : isCompleted
              ? 'bg-stone-200 text-stone-800'
              : 'bg-stone-100 text-stone-400'
          }`}
        >
          {isCompleted || isLive ? (
            <span>
              {match.home_score} – {match.away_score}
            </span>
          ) : (
            <span className="text-sm font-semibold text-stone-400">vs</span>
          )}
        </div>

        <span
          className={`flex-1 text-right text-sm font-bold ${
            isCompleted && match.away_score > match.home_score
              ? 'text-uv3-green-dark'
              : 'text-stone-800'
          }`}
        >
          {awayTeamName}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-[10px] text-stone-500">
        <span>📍 {venueName}</span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
}
