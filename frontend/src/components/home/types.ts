// Tipos de presentación compartidos por las columnas de la portada.

export interface HomeStory {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  image_url?: string | null;
  is_featured?: boolean;
}

export interface HomeStanding {
  team: { name: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goal_difference: number;
}

export interface HomeMatch {
  id: string;
  round: number;
  home_team: { name: string };
  away_team: { name: string };
  date_time: string;
  venue: { name: string };
  status: string;
  home_score: number;
  away_score: number;
}
