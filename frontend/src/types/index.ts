// UV3 Platform — Shared TypeScript Types

export type UserRole = 'admin' | 'organizer' | 'delegate' | 'referee' | 'user';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  delegate_id: string | null;
  delegate?: User | null;
  players?: Player[];
  created_at: string;
  updated_at: string;
}

export type PlayerPosition = 'arquero' | 'defensa' | 'mediocampista' | 'delantero';

export interface Player {
  id: string;
  team_id: string | null;
  first_name: string;
  last_name: string;
  dni: string | null;
  birth_date: string | null;
  jersey_number: number | null;
  position: PlayerPosition | null;
  photo_url: string | null;
  team?: Team | null;
  created_at: string;
  updated_at: string;
}

export type TournamentStatus = 'draft' | 'active' | 'finished';
export type TournamentFormat = 'liga' | 'grupos' | 'eliminacion';

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  status: TournamentStatus;
  format: TournamentFormat;
  category: string;
  banner_url: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export type MatchStatus = 'scheduled' | 'playing' | 'completed' | 'cancelled';

export interface Match {
  id: string;
  tournament_id: string;
  home_team_id: string;
  away_team_id: string;
  venue_id: string | null;
  date_time: string | null;
  referee_id: string | null;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  round: number;
  home_team?: Team;
  away_team?: Team;
  venue?: Venue;
  referee?: User;
  created_at: string;
  updated_at: string;
}

export interface Standing {
  id: string;
  tournament_id: string;
  team_id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  team?: Team;
  created_at: string;
  updated_at: string;
}

export type GoalType = 'regular' | 'penalty' | 'own_goal';

export interface Goal {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  minute: number | null;
  type: GoalType;
  player?: Player;
  team?: Team;
  created_at: string;
}

export type CardType = 'yellow' | 'red' | 'suspension';

export interface Sanction {
  id: string;
  match_id: string;
  player_id: string;
  card_type: CardType;
  reason: string | null;
  duration_matches: number;
  player?: Player;
  created_at: string;
}

export interface ScheduleSlot {
  id: string;
  tournament_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  venue_id: string | null;
  venue?: Venue;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  author_id: string | null;
  category: 'general' | 'deportes' | 'eventos' | 'comunicado';
  author?: User;
  created_at: string;
  updated_at: string;
}

export interface Gallery {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
}

// Action response type
export interface ActionResponse<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

// Fixture engine types
export interface MatchInput {
  tournament_id: string;
  home_team_id: string;
  away_team_id: string;
  venue_id: string | null;
  date_time: string | null;
  round: number;
}
