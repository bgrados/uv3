import Link from 'next/link';
import { SectionHeading, Kicker } from '@/components/home/SectionHeading';
import type { HomeMatch, HomeStanding } from '@/components/home/types';

function MatchRow({ match, completed }: { match: HomeMatch; completed: boolean }) {
  return (
    <div className={`border-b border-stone-200 py-2.5 text-xs ${completed ? 'text-stone-600' : 'text-[#44403c]'}`}>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        <span>Jornada {match.round}</span>
        <span>{match.venue.name}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-left font-bold text-uv3-green-dark">{match.home_team.name}</span>
        <span className="shrink-0 rounded bg-stone-100 px-2 py-0.5 font-mono text-sm font-bold">
          {completed ? `${match.home_score}-${match.away_score}` : 'vs'}
        </span>
        <span className="min-w-0 flex-1 truncate text-right font-bold text-uv3-green-dark">{match.away_team.name}</span>
      </div>
      <p className="mt-1 text-center text-[10px] text-stone-500">
        {new Date(match.date_time).toLocaleDateString('es-PE', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Lima',
        })}
      </p>
    </div>
  );
}

/**
 * Columna 2 — El Deportivo UV3: torneo, tabla de posiciones, partidos y
 * disponibilidad de canchas.
 */
export function ColumnDeportivo({
  standings,
  upcomingMatches,
  recentResults,
}: {
  standings: HomeStanding[];
  upcomingMatches: HomeMatch[];
  recentResults: HomeMatch[];
}) {
  return (
    <div className="space-y-6 lg:border-l lg:border-r lg:border-stone-200 lg:px-6">
      <SectionHeading label="El Deportivo UV3" accent="gold" hint="Torneo Activo" />

      {/* ── Banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-uv3-green-dark to-uv3-green p-5 text-white shadow-md">
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-uv3-gold/20 blur-2xl" />
        <Kicker>Campeonato Apertura 2026</Kicker>
        <h4 className="mt-1 font-heading text-xl font-bold uppercase tracking-wide">Liga Vecinal en marcha</h4>
        <p className="mt-1 text-xs leading-relaxed text-white/80">
          Organizado por la comisión de deportes de la Junta Vecinal de la UV3. Fomentando el compañerismo y el talento
          barrial.
        </p>
        <Link
          href="/tournaments"
          className="mt-4 inline-block rounded bg-uv3-gold px-3 py-1.5 text-xs font-bold text-uv3-green-dark shadow-sm transition-all hover:bg-white"
        >
          Ver fixture y reglas
        </Link>
      </div>

      {/* ── Tabla de posiciones ─────────────────────────────────────── */}
      <div className="space-y-2">
        <h4 className="border-b border-stone-200 pb-1 font-heading text-sm font-bold uppercase tracking-wider text-uv3-green-dark">
          🏆 Tabla de Posiciones
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-300 text-[10px] uppercase tracking-wider text-stone-500">
                <th className="py-1">#</th>
                <th className="py-1">Equipo</th>
                <th className="py-1 text-center">PJ</th>
                <th className="py-1 text-center">G</th>
                <th className="py-1 text-center">E</th>
                <th className="py-1 text-center">P</th>
                <th className="py-1 text-center">DG</th>
                <th className="py-1 text-center font-bold text-uv3-green-dark">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((item, idx) => (
                <tr key={idx} className="border-b border-stone-100 transition-colors hover:bg-stone-50">
                  <td className="py-2 font-bold text-stone-500">{idx + 1}</td>
                  <td className="py-2 font-semibold text-uv3-green-dark">{item.team.name}</td>
                  <td className="py-2 text-center text-stone-600">{item.played}</td>
                  <td className="py-2 text-center text-stone-600">{item.won}</td>
                  <td className="py-2 text-center text-stone-600">{item.drawn}</td>
                  <td className="py-2 text-center text-stone-600">{item.lost}</td>
                  <td className="py-2 text-center text-stone-600">
                    {item.goal_difference > 0 ? `+${item.goal_difference}` : item.goal_difference}
                  </td>
                  <td className="py-2 text-center font-bold text-uv3-green-dark">{item.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] italic text-stone-500">
          * Clasifican los 4 primeros a la liguilla final por el trofeo de la Junta General.
        </p>
      </div>

      {/* ── Próximos partidos ───────────────────────────────────────── */}
      <div>
        <h4 className="border-b border-stone-200 pb-1 font-heading text-sm font-bold uppercase tracking-wider text-uv3-green-dark">
          ⚽ Próximos encuentros
        </h4>
        <div className="mt-1 divide-y divide-stone-200">
          {upcomingMatches.length > 0 ? (
            upcomingMatches.map((m) => <MatchRow key={m.id} match={m} completed={false} />)
          ) : (
            <p className="py-3 text-xs text-stone-500">Sin partidos programados por ahora.</p>
          )}
        </div>
      </div>

      {/* ── Últimos resultados ──────────────────────────────────────── */}
      {recentResults.length > 0 && (
        <div>
          <h4 className="border-b border-stone-200 pb-1 font-heading text-sm font-bold uppercase tracking-wider text-uv3-green-dark">
            📻 Últimos resultados
          </h4>
          <div className="mt-1 divide-y divide-stone-200">
            {recentResults.map((m) => (
              <MatchRow key={m.id} match={m} completed />
            ))}
          </div>
        </div>
      )}

      {/* ── Canchas disponibles ─────────────────────────────────────── */}
      <Link
        href="/reservas"
        className="block border border-uv3-green/25 bg-uv3-green/5 p-4 transition-colors hover:bg-uv3-green/10"
      >
        <p className="font-heading text-sm font-bold text-uv3-green-dark">🟢 Reserva tu cancha online</p>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">
          Consulta la disponibilidad del día y asegura tu horario en la cancha sintética o la losa. Pago por Yape.
        </p>
        <span className="mt-2 inline-block text-[11px] font-bold uppercase tracking-wider text-uv3-green">
          Ver horarios libres →
        </span>
      </Link>
    </div>
  );
}
