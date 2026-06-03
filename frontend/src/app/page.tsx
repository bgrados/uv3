import Image from 'next/image';
import Link from 'next/link';
import { getCurrentUser } from '@/app/auth/actions';
import { createClient } from '@/utils/supabase/server';

// =========================================================================
// MOCK DATA FALLBACKS (Realistic content inspired by UV3's local life)
// =========================================================================
const FALLBACK_ANNOUNCEMENTS = [
  {
    id: '1',
    title: 'Asoc. Junta General de Propietarios UV3 convoca a asamblea extraordinaria de delegados',
    content: 'La junta directiva convoca a todos los delegados de los bloques de la Unidad Vecinal Nº3 a la asamblea este viernes a las 8:00 PM en el local comunal. Se tratarán temas de presupuesto anual, mejoras en la iluminación de áreas verdes y el avance de la digitalización vecinal.',
    category: 'general',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Mantenimiento preventivo en la Cancha Sintética Principal del Sector Central',
    content: 'Se informa a los equipos inscritos y vecinos en general que la cancha de gras sintético estará cerrada por trabajos de nivelación e iluminación desde el lunes hasta el miércoles de la próxima semana. Agradecemos su cooperación para mantener nuestros espacios.',
    category: 'comunicado',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    title: 'Gran éxito en la campaña vecinal de salud y vacunación familiar',
    content: 'En coordinación con la municipalidad y el centro de salud local, se atendió a más de 300 familias en la losa deportiva del Sector A. Agradecemos al equipo de voluntarios vecinales por su excelente organización.',
    category: 'eventos',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '4',
    title: 'Requisitos y entrega de credenciales para delegados del Campeonato Apertura 2026',
    content: 'La comisión organizadora del torneo anuncia la apertura del padrón de registro y entrega de credenciales para los delegados acreditados. El trámite se realizará en la oficina de deportes los martes de 6 a 8 PM.',
    category: 'deportes',
    created_at: new Date(Date.now() - 259200000).toISOString(),
  }
];

const FALLBACK_STANDINGS = [
  { team: { name: 'Real Unidad Vecinal 3' }, played: 3, won: 2, drawn: 1, lost: 0, points: 7, goal_difference: 4 },
  { team: { name: 'Deportivo Block 5 FC' }, played: 3, won: 2, drawn: 0, lost: 1, points: 6, goal_difference: 2 },
  { team: { name: 'Juventud Sector A' }, played: 3, won: 1, drawn: 2, lost: 0, points: 5, goal_difference: 1 },
  { team: { name: 'Defensor Block 12' }, played: 3, won: 1, drawn: 0, lost: 2, points: 3, goal_difference: -2 },
  { team: { name: 'Sport Amigos del Parque' }, played: 3, won: 0, drawn: 1, lost: 2, points: 1, goal_difference: -5 }
];

const FALLBACK_MATCHES = [
  {
    id: 'm1',
    round: 2,
    home_team: { name: 'Real Unidad Vecinal 3' },
    away_team: { name: 'Deportivo Block 5 FC' },
    date_time: new Date(Date.now() + 172800000).toISOString(), // + 2 days
    venue: { name: 'Cancha Sintética Principal' },
    status: 'scheduled',
    home_score: 0,
    away_score: 0
  },
  {
    id: 'm2',
    round: 1,
    home_team: { name: 'Juventud Sector A' },
    away_team: { name: 'Real Unidad Vecinal 3' },
    date_time: new Date(Date.now() - 259200000).toISOString(), // - 3 days
    venue: { name: 'Losa Sector A' },
    status: 'completed',
    home_score: 2,
    away_score: 3
  },
  {
    id: 'm3',
    round: 2,
    home_team: { name: 'Defensor Block 12' },
    away_team: { name: 'Sport Amigos del Parque' },
    date_time: new Date(Date.now() + 259200000).toISOString(), // + 3 days
    venue: { name: 'Cancha Sintética Principal' },
    status: 'scheduled',
    home_score: 0,
    away_score: 0
  }
];

export default async function HomePage() {
  const user = await getCurrentUser();

  // ─────────────────────────────────────────────────────────────────
  // DATA FETCHING (Supabase with graceful fallback)
  // ─────────────────────────────────────────────────────────────────
  let announcements = FALLBACK_ANNOUNCEMENTS;
  let standings = FALLBACK_STANDINGS;
  let matches = FALLBACK_MATCHES;
  let isDbConnected = false;

  try {
    const supabase = await createClient();
    if (supabase) {
      // Fetch announcements
      const { data: dbAnnouncements, error: aErr } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (!aErr && dbAnnouncements && dbAnnouncements.length > 0) {
        announcements = dbAnnouncements;
      }

      // Fetch standings
      const { data: dbStandings, error: sErr } = await supabase
        .from('standings')
        .select('*, team:teams(name)')
        .order('points', { ascending: false })
        .order('goal_difference', { ascending: false })
        .limit(5);

      if (!sErr && dbStandings && dbStandings.length > 0) {
        standings = dbStandings.map(s => ({
          team: { name: s.team?.name || 'Equipo' },
          played: s.played || 0,
          won: s.won || 0,
          drawn: s.drawn || 0,
          lost: s.lost || 0,
          points: s.points || 0,
          goal_difference: s.goal_difference || 0
        }));
      }

      // Fetch matches
      const { data: dbMatches, error: mErr } = await supabase
        .from('matches')
        .select('*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), venue:venues(name)')
        .order('date_time', { ascending: true })
        .limit(4);

      if (!mErr && dbMatches && dbMatches.length > 0) {
        matches = dbMatches.map(m => ({
          id: m.id,
          round: m.round || 1,
          home_team: { name: m.home_team?.name || 'Local' },
          away_team: { name: m.away_team?.name || 'Visita' },
          date_time: m.date_time,
          venue: { name: m.venue?.name || 'Cancha Principal' },
          status: m.status || 'scheduled',
          home_score: m.home_score || 0,
          away_score: m.away_score || 0
        }));
      }
      isDbConnected = true;
    }
  } catch (error) {
    console.warn('Supabase not fully configured, rendering with mock database fallbacks.', error);
  }

  // Format today's date elegantly
  const today = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const featuredStory = announcements[0] || FALLBACK_ANNOUNCEMENTS[0];
  const sideStories = announcements.slice(1, 4);

  return (
    <main className="min-h-screen bg-uv3-bg text-[#1c1917] font-sans selection:bg-uv3-gold selection:text-uv3-green-dark">
      
      {/* ─────────────────────────────────────────────────────────────────
          TOP HEADER / METADATA & NAV
          ───────────────────────────────────────────────────────────────── */}
      <div className="bg-uv3-green-dark text-white border-b-2 border-uv3-gold py-2 text-xs">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-[11px] tracking-wider uppercase text-white/90">
            <span>🇵🇪 Cercado de Lima, Perú</span>
            <span className="hidden md:inline">•</span>
            <span>Edición Digital Nº 124</span>
            <span className="hidden md:inline">•</span>
            <span>Junta General de Propietarios UV3</span>
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <a 
              href="https://www.facebook.com/profile.php?id=61564444126122" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 text-uv3-gold hover:text-white transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
              </svg>
              Facebook Oficial UV3
            </a>
            {user ? (
              <Link
                href="/dashboard"
                className="bg-uv3-gold text-uv3-green-dark px-3 py-1 rounded font-bold hover:bg-white transition-colors"
              >
                Panel Administrativo
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-white hover:text-uv3-gold transition-colors"
              >
                Acceso Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          EDITORIAL MASTHEAD (Classic Newspaper Header)
          ───────────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b-4 border-double border-uv3-green-dark py-6">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-center text-center">
          
          {/* Logo and Titles */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-uv3-green-dark p-1 bg-white shadow-md">
              <Image
                src="/logo.jpg"
                alt="Logo Unidad Vecinal 3"
                fill
                className="rounded-full object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-uv3-gold">
                Vocero e Información Comunitaria
              </span>
              <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-uv3-green-dark leading-none">
                UV3 DIARIO
              </h1>
              <span className="font-heading italic text-sm text-uv3-green tracking-wide mt-1">
                "El corazón digital y deportivo de la comunidad"
              </span>
            </div>
          </div>

          {/* Date and Ticker Header */}
          <div className="w-full border-t-2 border-b-2 border-uv3-green-dark/20 py-2 flex flex-col sm:flex-row items-center justify-between text-xs text-[#5e5447] italic gap-2 px-2">
            <span className="capitalize font-medium font-sans">
              📅 {today}
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
              <span className="font-bold text-red-600 uppercase tracking-wider not-italic text-[10px]">
                Última Hora Vecinal:
              </span>
              <span className="font-semibold text-uv3-green-dark max-w-sm truncate not-italic">
                {featuredStory ? featuredStory.title : 'Se inicia el portal deportivo y vecinal oficial.'}
              </span>
            </div>
            <span className="font-semibold text-uv3-green-dark">
              {isDbConnected ? '🟢 Sistema Conectado' : '⚡ Modo Offline'}
            </span>
          </div>

          {/* Editorial Quick Navigation */}
          <nav className="mt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-sm font-semibold uppercase tracking-wider text-[#44403c] border-b border-uv3-green-dark/10 pb-2 w-full">
            <Link href="/" className="text-uv3-green border-b-2 border-uv3-green pb-1">Portada</Link>
            <Link href="/announcements" className="hover:text-uv3-green transition-colors pb-1">Noticias Vecinales</Link>
            <Link href="/tournaments" className="hover:text-uv3-green transition-colors pb-1">Campeonatos</Link>
            <Link href="/gallery" className="hover:text-uv3-green transition-colors pb-1">Galería de Fotos</Link>
            <a 
              href="https://www.facebook.com/profile.php?id=61564444126122" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-uv3-green text-[#1877F2] transition-colors pb-1 flex items-center gap-1"
            >
              Comunidad en Facebook
            </a>
          </nav>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────
          MAIN FRONT PAGE LAYOUT (Magazine Grid)
          ───────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        
        {/* FACEBOOK OFFICIAL PANEL SPOTLIGHT */}
        <div className="mb-8 border-2 border-uv3-gold bg-amber-50/50 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-[#1877F2] text-white p-3 rounded-lg flex items-center justify-center shadow-md">
              <svg className="h-8 w-8 fill-current" viewBox="0 0 24 24">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-uv3-green">Comunicación Oficial Vecinal</span>
              <h2 className="font-heading text-xl font-bold text-uv3-green-dark mt-1">
                Asoc. Junta General de Propietarios UV3 (Periodo 2024 - 2026)
              </h2>
              <p className="text-sm text-[#57534e] mt-1.5 leading-relaxed max-w-3xl">
                La Junta General de Propietarios es la encargada oficial de la representación, asambleas de delegados, 
                coordinación de servicios y el cuidado vecinal de los bloques de la Unidad Vecinal Nº3. 
                Sigue nuestra página de Facebook para recibir al instante las actas de reuniones, comunicados oficiales y actividades locales.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs font-semibold text-[#78716c]">
                <span>👍 1.293 Me Gusta</span>
                <span>•</span>
                <span>🗣️ 181 Vecinos hablando de esto</span>
                <span>•</span>
                <span>🏆 Copa y Campeonato Activo</span>
              </div>
            </div>
          </div>
          <a
            href="https://www.facebook.com/profile.php?id=61564444126122"
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap bg-[#1877F2] text-white hover:bg-[#165fc7] px-5 py-3 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5"
          >
            Seguir en Facebook
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M14 3h7v7h-2v-3.586l-9.293 9.293-1.414-1.414 9.293-9.293h-3.586v-2zM2 2v20h20v-10h-2v8h-16v-16h8v-2h-10z"/>
            </svg>
          </a>
        </div>

        {/* THREE COLUMN EDITORIAL BODY */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1.1fr_0.80fr]">
          
          {/* =========================================================================
              COLUMNA 1: GESTIÓN VECINAL Y COMUNIDAD (DIARIO PORTADA)
              ========================================================================= */}
          <div className="space-y-6">
            <div className="border-b-4 border-uv3-green pb-1.5">
              <h3 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-uv3-green-dark">
                Sección Vecinal & Gestión
              </h3>
            </div>

            {/* Featured Article */}
            {featuredStory && (
              <article className="space-y-4">
                <span className="inline-block bg-uv3-green text-white text-[10px] font-bold uppercase px-2 py-0.5 tracking-wider rounded">
                  {featuredStory.category.toUpperCase()}
                </span>
                <h4 className="font-heading text-2xl sm:text-3xl font-black leading-tight text-uv3-green-dark hover:text-uv3-green transition-colors">
                  {featuredStory.title}
                </h4>
                <p className="text-[11px] text-[#78716c] uppercase tracking-wider font-semibold">
                  Por: Junta Vecinal UV3 · {new Date(featuredStory.created_at).toLocaleDateString('es-PE')}
                </p>
                <div className="relative h-[240px] w-full border border-uv3-green-dark/10 overflow-hidden rounded bg-stone-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
                  <Image
                    src="/uv3-news-1.jpg"
                    alt={featuredStory.title}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    priority
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white text-xs">
                    <p className="font-semibold italic">Archivo Histórico: Entorno de la Unidad Vecinal Nº3, Lima.</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-[#44403c] text-justify font-sans">
                  {featuredStory.content}
                </p>
                <div className="pt-2 border-b border-stone-200"></div>
              </article>
            )}

            {/* Side Stories (Grid of smaller cards) */}
            <div className="space-y-4">
              {sideStories.map((story) => (
                <div key={story.id} className="border-b border-stone-200/80 pb-4 last:border-0 last:pb-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-uv3-gold">
                    {story.category.toUpperCase()}
                  </span>
                  <h5 className="font-heading text-base font-bold text-uv3-green-dark hover:text-uv3-green mt-1">
                    <Link href={`/announcements#${story.id}`}>{story.title}</Link>
                  </h5>
                  <p className="text-xs text-[#57534e] mt-1 leading-relaxed line-clamp-2">
                    {story.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-uv3-bg border border-uv3-green/20 p-4 rounded-lg">
              <h5 className="font-heading text-sm font-bold text-uv3-green-dark">¿Tienes alguna denuncia o sugerencia vecinal?</h5>
              <p className="text-xs text-[#57534e] mt-1">
                La Junta General de Propietarios recibe reclamos sobre mantenimiento, seguridad y deportes en su local oficial frente al parque central.
              </p>
            </div>
          </div>

          {/* =========================================================================
              COLUMNA 2: EL DEPORTIVO UV3 (SECCIÓN LIGA DEPORTIVA)
              ========================================================================= */}
          <div className="space-y-6 lg:border-l lg:border-r lg:border-stone-200 lg:px-6">
            <div className="border-b-4 border-uv3-gold pb-1.5 flex justify-between items-end">
              <h3 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-uv3-green-dark">
                El Deportivo UV3
              </h3>
              <span className="text-[10px] font-bold uppercase bg-uv3-gold/20 text-uv3-green-dark px-1.5 py-0.5 rounded">
                Torneo Activo
              </span>
            </div>

            {/* Banner deportivo */}
            <div className="bg-gradient-to-br from-uv3-green-dark to-uv3-green text-white p-5 rounded-lg shadow-md relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-uv3-gold/20 rounded-full blur-2xl"></div>
              <h4 className="font-heading text-xl font-bold uppercase tracking-wide">
                Campeonato Apertura 2026
              </h4>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                Organizado por la comisión de deportes de la Junta Vecinal de la UV3. Fomentando el compañerismo y el talento barrial.
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href="/tournaments"
                  className="bg-uv3-gold hover:bg-white text-uv3-green-dark px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm"
                >
                  Ver Fixture y Reglas
                </Link>
              </div>
            </div>

            {/* Standings Widget (Tabla de Posiciones) */}
            <div className="space-y-3">
              <h4 className="font-heading text-sm font-bold text-uv3-green-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-1">
                🏆 Tabla de Posiciones (Liga Vecinal)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-stone-300 text-stone-500 uppercase tracking-wider text-[10px]">
                      <th className="py-1">Pos</th>
                      <th className="py-1">Equipo</th>
                      <th className="py-1 text-center">PJ</th>
                      <th className="py-1 text-center">DG</th>
                      <th className="py-1 text-center font-bold text-uv3-green-dark">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((item, idx) => (
                      <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                        <td className="py-2.5 font-bold text-stone-500">{idx + 1}</td>
                        <td className="py-2.5 font-semibold text-uv3-green-dark">{item.team.name}</td>
                        <td className="py-2.5 text-center text-stone-600">{item.played}</td>
                        <td className="py-2.5 text-center text-stone-600">{item.goal_difference > 0 ? `+${item.goal_difference}` : item.goal_difference}</td>
                        <td className="py-2.5 text-center font-bold text-uv3-green-dark">{item.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-stone-500 italic">
                * Clasifican los 4 primeros a la liguilla final por el trofeo de la Junta General.
              </p>
            </div>

            {/* Partidos Destacados / Próximos Encuentros */}
            <div className="space-y-3">
              <h4 className="font-heading text-sm font-bold text-uv3-green-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-1">
                ⚽ Centro de Partidos
              </h4>
              <div className="space-y-3">
                {matches.map((match, idx) => {
                  const isCompleted = match.status === 'completed';
                  return (
                    <div 
                      key={idx} 
                      className={`p-3 rounded border text-xs transition-all ${
                        isCompleted 
                          ? 'bg-stone-50/50 border-stone-200' 
                          : 'bg-white border-uv3-green-dark/15 shadow-[0_2px_8px_rgba(20,131,59,0.05)]'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-stone-500 uppercase font-semibold">
                        <span>Jornada {match.round}</span>
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          isCompleted ? 'bg-stone-200 text-stone-700' : 'bg-uv3-gold/20 text-uv3-green-dark'
                        }`}>
                          {isCompleted ? 'Finalizado' : 'Próximo'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between my-2">
                        <span className="font-bold text-uv3-green-dark truncate max-w-[120px]">{match.home_team.name}</span>
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-stone-100 font-mono font-bold text-sm">
                          {isCompleted ? (
                            <span>{match.home_score} - {match.away_score}</span>
                          ) : (
                            <span className="text-stone-400 text-xs">vs</span>
                          )}
                        </div>
                        <span className="font-bold text-uv3-green-dark truncate max-w-[120px] text-right">{match.away_team.name}</span>
                      </div>

                      <div className="text-[10px] text-stone-500 flex justify-between items-center border-t border-stone-100 pt-1.5 mt-1.5">
                        <span>📍 {match.venue.name}</span>
                        <span>
                          {new Date(match.date_time).toLocaleDateString('es-PE', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* =========================================================================
              COLUMNA 3: AVISOS Y ARCHIVO HISTÓRICO (BOLETÍN VECINAL)
              ========================================================================= */}
          <div className="space-y-6">
            <div className="border-b-4 border-stone-400 pb-1.5">
              <h3 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#44403c]">
                Avisos y Utilidad
              </h3>
            </div>

            {/* Boletines Vecinales Rápidos */}
            <div className="border border-stone-200 bg-white p-5 rounded-lg shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-uv3-green">Servicios al Vecino</p>
              <h4 className="font-heading text-base font-bold text-uv3-green-dark mt-1">Horarios de Canchas y Reserva</h4>
              <ul className="mt-3 space-y-3 text-xs leading-relaxed text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="text-uv3-gold mt-0.5">▪</span>
                  <span><strong>Lunes a Viernes:</strong> 4:00 PM a 10:00 PM (Prioridad para entrenamientos de escuelas vecinales).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-uv3-gold mt-0.5">▪</span>
                  <span><strong>Sábados y Domingos:</strong> 8:00 AM a 9:00 PM (Fechas del Campeonato y alquiler general).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-uv3-gold mt-0.5">▪</span>
                  <span><strong>Reservas:</strong> Coordinar directamente con el delegado de deportes presentando DNI con dirección en la UV3.</span>
                </li>
              </ul>
            </div>

            {/* Directiva de Propietarios - Contactos */}
            <div className="border border-stone-200 bg-white p-5 rounded-lg shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-uv3-gold">Junta Vecinal 2024-2026</p>
              <h4 className="font-heading text-base font-bold text-uv3-green-dark mt-1">Junta de Administración</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Asociación encargada de la infraestructura, seguridad, parques, canchas y salones multiusos.
              </p>
              <div className="mt-3 space-y-2 text-xs text-stone-700">
                <div>
                  <p className="font-bold">📍 Local Comunal UV3</p>
                  <p className="text-stone-500 text-[11px]">Cerca de la UNMSM, Cercado de Lima</p>
                </div>
                <div>
                  <p className="font-bold">✉️ Contacto Oficial</p>
                  <p className="text-stone-500 text-[11px]">Mediante la página de Facebook autorizada</p>
                </div>
              </div>
            </div>

            {/* Archivo Histórico / Galería Preview */}
            <div className="border border-stone-200 bg-white p-4 rounded-lg shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-stone-100 pb-1.5">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-uv3-green-dark">
                  📷 Archivo Histórico UV3
                </h4>
                <Link href="/gallery" className="text-[10px] font-bold text-uv3-green hover:underline">
                  Abrir Galería
                </Link>
              </div>

              <div className="relative h-40 w-full overflow-hidden rounded bg-stone-100">
                <Image
                  src="/uv3-news-2.jpg"
                  alt="Patrimonio Unidad Vecinal 3"
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <p className="text-[11px] leading-relaxed text-stone-500 italic">
                Inaugurada a mediados del siglo XX como el primer gran complejo habitacional moderno de Lima, la UV3 destaca por sus grandes espacios libres.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          EDITORIAL BOTTOM SECTION (Páginas del Diario)
          ───────────────────────────────────────────────────────────────── */}
      <section className="bg-stone-100 border-t border-b border-stone-300 py-8">
        <div className="mx-auto max-w-7xl px-6 grid gap-6 md:grid-cols-3 text-xs text-[#57534e]">
          <div className="space-y-2">
            <h5 className="font-heading font-bold text-uv3-green-dark uppercase tracking-wider">Identidad de Barrio</h5>
            <p className="leading-relaxed">
              La Unidad Vecinal Nº3 fue declarada patrimonio por su valor urbanístico. Este diario promueve la memoria colectiva, la cultura vecinal y el cuidado común.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-heading font-bold text-uv3-green-dark uppercase tracking-wider">Ligas y Fair Play</h5>
            <p className="leading-relaxed">
              Nuestros campeonatos se rigen bajo reglas estrictas de disciplina y respeto. El Tribunal de Justicia Vecinal evalúa y sanciona cualquier conducta antideportiva.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-heading font-bold text-uv3-green-dark uppercase tracking-wider">Canal Digital Oficial</h5>
            <p className="leading-relaxed">
              Este sitio web y la página de Facebook oficial son las únicas vías de publicación autorizadas por la Asociación Junta General de Propietarios UV3.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          FOOTER (Colofón Editorial)
          ───────────────────────────────────────────────────────────────── */}
      <footer className="bg-uv3-green-dark text-white py-12 border-t-4 border-uv3-gold">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-white p-0.5">
              <Image
                src="/logo.jpg"
                alt="Logo UV3"
                fill
                className="rounded-full object-cover"
              />
            </div>
            <div>
              <p className="font-heading text-lg font-bold tracking-tight">UV3 Diario</p>
              <p className="text-xs text-white/60">© 2026 Asociación Junta General de Propietarios de la Unidad Vecinal N°3</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/85">
            <Link href="/announcements" className="hover:text-uv3-gold transition-colors">Comunicados</Link>
            <Link href="/tournaments" className="hover:text-uv3-gold transition-colors">Deportes</Link>
            <Link href="/gallery" className="hover:text-uv3-gold transition-colors">Galería</Link>
            <a 
              href="https://www.facebook.com/profile.php?id=61564444126122" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-uv3-gold text-uv3-gold transition-colors font-semibold"
            >
              Facebook Oficial
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
