/**
 * Verifica el estado de la base de datos de Supabase de UV3 sin necesidad de psql.
 *
 * Uso:
 *   node scripts/check-supabase.mjs
 *
 * Lee las claves desde frontend/.env.local (o desde variables de entorno).
 * Con la service_role key comprueba además los buckets de Storage.
 *
 * Equivale al `database/verify.sql`, pero desde la API REST.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = parseEnvFile(envPath);
const env = { ...fileEnv, ...process.env };

const url = (env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const anonKey = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

const PLACEHOLDERS = ['your-project', 'your-anon-key', 'your-service-key', 'placeholder'];

function isPlaceholder(value) {
  if (!value) return true;
  if (value.length < 40) return true;
  return PLACEHOLDERS.some((p) => value.includes(p));
}

const hasServiceKey = !isPlaceholder(serviceKey);
const hasAnonKey = !isPlaceholder(anonKey);
const key = hasServiceKey ? serviceKey : anonKey;

if (isPlaceholder(url) || !key) {
  console.log('[check-supabase] Las claves en .env.local siguen siendo placeholders.');
  console.log('                 Pega NEXT_PUBLIC_SUPABASE_ANON_KEY (y opcionalmente SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(2);
}

console.log(`[check-supabase] Proyecto: ${url}`);
console.log(
  `[check-supabase] Clave usada: ${hasServiceKey ? 'service_role' : 'anon'}`
);
console.log('');

const headers = { apikey: key, Authorization: `Bearer ${key}` };

const TABLES = [
  'users',
  'venues',
  'teams',
  'players',
  'tournaments',
  'matches',
  'standings',
  'goals',
  'sanctions',
  'schedules',
  'announcements',
  'galleries',
  'notices',
  'board_members',
  'treasury_entries',
  'spaces',
  'space_sports',
  'space_blocks',
  'reservations',
  'businesses',
  'site_settings',
];

const BUCKETS = ['team-logos', 'player-photos', 'tournament-banners'];

let failures = 0;

async function countRows(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { ...headers, Prefer: 'count=exact' },
  });
  if (res.status === 404) return { ok: false };
  if (!res.ok) return { ok: false, status: res.status };
  const range = res.headers.get('content-range') || '';
  const total = range.includes('/') ? range.split('/')[1] : '?';
  return { ok: true, total };
}

console.log('== Tablas ==');
for (const table of TABLES) {
  const result = await countRows(table);
  if (result.ok) {
    console.log(`  OK    ${table.padEnd(14)} filas: ${result.total}`);
  } else {
    failures += 1;
    console.log(`  FALTA ${table.padEnd(14)} (status ${result.status ?? 'n/d'})`);
  }
}

console.log('');
console.log('== Columnas requeridas por el frontend ==');
const columnChecks = [
  ['users', 'full_name'],
  ['users', 'username'],
  ['users', 'role'],
  ['users', 'email'],
  ['venues', 'name'],
  ['venues', 'location'],
  ['teams', 'logo_url'],
  ['teams', 'delegate_id'],
  ['players', 'team_id'],
  ['players', 'first_name'],
  ['players', 'last_name'],
  ['players', 'dni'],
  ['players', 'birth_date'],
  ['players', 'jersey_number'],
  ['players', 'position'],
  ['players', 'photo_url'],
  ['tournaments', 'sport'],
  ['tournaments', 'format'],
  ['tournaments', 'status'],
  ['tournaments', 'description'],
  ['tournaments', 'start_date'],
  ['tournaments', 'end_date'],
  ['matches', 'tournament_id'],
  ['matches', 'home_team_id'],
  ['matches', 'away_team_id'],
  ['matches', 'venue_id'],
  ['matches', 'referee_id'],
  ['matches', 'date_time'],
  ['matches', 'status'],
  ['matches', 'home_score'],
  ['matches', 'away_score'],
  ['matches', 'round'],
  ['standings', 'tournament_id'],
  ['standings', 'team_id'],
  ['standings', 'points'],
  ['standings', 'goal_difference'],
  ['goals', 'match_id'],
  ['goals', 'player_id'],
  ['goals', 'team_id'],
  ['goals', 'minute'],
  ['sanctions', 'match_id'],
  ['sanctions', 'player_id'],
  ['schedules', 'tournament_id'],
  ['announcements', 'title'],
  ['announcements', 'category'],
  ['galleries', 'title'],
  ['galleries', 'images'],
  ['notices', 'title'],
  ['notices', 'is_active'],
  ['board_members', 'full_name'],
  ['board_members', 'position'],
  ['treasury_entries', 'amount'],
  ['treasury_entries', 'is_published'],
  ['spaces', 'name'],
  ['spaces', 'day_rate'],
  ['reservations', 'status'],
  ['businesses', 'name'],
  ['businesses', 'is_active'],
  ['site_settings', 'site_name'],
];
let columnsOk = 0;
for (const [table, column] of columnChecks) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${column}&limit=1`, { headers });
  if (res.ok) {
    columnsOk += 1;
  } else {
    failures += 1;
    console.log(`  FALTA ${table}.${column} (status ${res.status})`);
  }
}
console.log(`  ${columnsOk}/${columnChecks.length} columnas presentes`);

console.log('');
console.log('== Buckets de Storage ==');
if (!hasServiceKey) {
  // Sin service_role no se puede listar buckets: se sondea el endpoint público
  // de objetos. Si el bucket no existe, Storage responde "Bucket not found".
  for (const bucket of BUCKETS) {
    const res = await fetch(`${url}/storage/v1/object/public/${bucket}/__uv3_probe__`, {
      headers,
    });
    const body = await res.text();
    const missing = /bucket not found/i.test(body);
    if (missing) {
      failures += 1;
      console.log(`  FALTA ${bucket}`);
    } else {
      console.log(`  OK    ${bucket} (sondeo público)`);
    }
  }
  console.log('  (sin SUPABASE_SERVICE_ROLE_KEY; comprobación aproximada)');
} else {
  const res = await fetch(`${url}/storage/v1/bucket`, { headers });
  if (!res.ok) {
    failures += 1;
    console.log(`  No se pudo listar buckets (status ${res.status})`);
  } else {
    const buckets = await res.json();
    const ids = new Set(buckets.map((b) => b.id ?? b.name));
    for (const bucket of BUCKETS) {
      if (ids.has(bucket)) {
        console.log(`  OK    ${bucket}`);
      } else {
        failures += 1;
        console.log(`  FALTA ${bucket}`);
      }
    }
  }
}

console.log('');
if (failures === 0) {
  console.log('[check-supabase] Todo OK.');
} else {
  console.log(
    `[check-supabase] ${failures} comprobación(es) pendientes. Ejecuta database/schema.sql, policies.sql y storage.sql en el SQL Editor de Supabase.`
  );
  process.exit(1);
}
