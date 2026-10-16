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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const key = serviceKey || anonKey;

const PLACEHOLDERS = ['your-project', 'your-anon-key', 'placeholder'];

function isPlaceholder(value) {
  if (!value) return true;
  return PLACEHOLDERS.some((p) => value.includes(p));
}

if (isPlaceholder(url) || isPlaceholder(key) || key.length < 40) {
  console.log('[check-supabase] Las claves en .env.local siguen siendo placeholders.');
  console.log('                 Ejecuta: npx vercel login && npx vercel env pull .env.local');
  process.exit(2);
}

console.log(`[check-supabase] Proyecto: ${url}`);
console.log(
  `[check-supabase] Clave usada: ${serviceKey ? 'service_role' : 'anon (los buckets pueden no listarse)'}`
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
  ['tournaments', 'sport'],
  ['galleries', 'images'],
];
for (const [table, column] of columnChecks) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${column}&limit=1`, { headers });
  if (res.ok) {
    console.log(`  OK    ${table}.${column}`);
  } else {
    failures += 1;
    console.log(`  FALTA ${table}.${column} (status ${res.status})`);
  }
}

console.log('');
console.log('== Buckets de Storage ==');
if (!serviceKey) {
  console.log('  (omitido: se requiere SUPABASE_SERVICE_ROLE_KEY para listar buckets)');
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
