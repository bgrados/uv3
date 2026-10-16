import type { SportType } from '@/types';

const SPORT_CONFIG: Record<SportType, { label: string; emoji: string; color: string }> = {
  futbol: { label: 'Fútbol', emoji: '⚽', color: 'bg-green-100 text-green-800' },
  futbol_sala: { label: 'Fútbol Sala', emoji: '🥅', color: 'bg-blue-100 text-blue-800' },
  basquet: { label: 'Básquet', emoji: '🏀', color: 'bg-orange-100 text-orange-800' },
  voley: { label: 'Vóley', emoji: '🏐', color: 'bg-purple-100 text-purple-800' },
};

interface SportBadgeProps {
  sport: SportType;
  size?: 'sm' | 'md';
}

export function SportBadge({ sport, size = 'md' }: SportBadgeProps) {
  const config = SPORT_CONFIG[sport] ?? SPORT_CONFIG.futbol;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide ${config.color} ${sizeClass}`}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
}

export const SPORT_LABEL: Record<SportType, string> = {
  futbol: 'Fútbol',
  futbol_sala: 'Fútbol Sala (Fúlbito)',
  basquet: 'Básquet',
  voley: 'Vóley',
};
