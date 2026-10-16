// UV3 PLATFORM — Prueba de humo de autenticación y permisos (sin navegador).
// Uso: node scripts/smoke-auth.mjs [email] [password]
// Por defecto: admin@uv3.com / password123 (usuarios creados por database/seeds.sql)
//
// Comprueba:
//   1. Login real contra Supabase Auth (grant_type=password).
//   2. Lectura del perfil/rol en public.users con el token del usuario.
//   3. Escritura permitida por RLS (crea y borra un equipo de prueba).

import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const file = path.resolve(process.cwd(), '.env.local');
  const out = {};
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return { ...out, ...process.env };
}

const env = loadEnv();
const url = (env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const anon = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const email = process.argv[2] || 'admin@uv3.com';
const password = process.argv[3] || 'password123';
const SMOKE_NAME = '__SMOKE_UV3__';

let failures = 0;
function fail(msg) {
  failures += 1;
  console.log(`  FALLO ${msg}`);
}

async function main() {
  if (!url || anon.length < 40) {
    console.log('[smoke-auth] Falta NEXT_PUBLIC_SUPABASE_URL / ANON_KEY en .env.local');
    process.exit(2);
  }

  console.log(`[smoke-auth] Proyecto: ${url}`);
  console.log(`[smoke-auth] Usuario:  ${email}`);
  console.log('');

  // 1. Login
  console.log('== 1. Login (Supabase Auth) ==');
  const loginRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const login = await loginRes.json();
  if (!loginRes.ok || !login.access_token) {
    fail(`login status ${loginRes.status}: ${login.error_description || login.msg || JSON.stringify(login)}`);
    console.log('');
    console.log('[smoke-auth] Ejecuta database/seeds.sql en Supabase para crear las cuentas demo.');
    process.exit(1);
  }
  const token = login.access_token;
  const userId = login.user?.id;
  console.log(`  OK    sesion iniciada (id ${userId})`);

  const headers = {
    apikey: anon,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. Perfil y rol
  console.log('');
  console.log('== 2. Perfil y rol (public.users) ==');
  const profileRes = await fetch(
    `${url}/rest/v1/users?select=full_name,role&id=eq.${userId}`,
    { headers }
  );
  const profile = await profileRes.json();
  if (!profileRes.ok || !Array.isArray(profile) || profile.length === 0) {
    fail(`no se pudo leer el perfil (status ${profileRes.status})`);
  } else {
    const role = profile[0].role;
    const staff = ['admin', 'organizer', 'referee'].includes(role);
    console.log(`  OK    rol="${role}" nombre="${profile[0].full_name ?? ''}"`);
    console.log(`        acceso al panel: ${staff ? 'SI' : 'NO (se le cerrara la sesion)'}`);
    if (!staff) fail(`el usuario ${email} no tiene rol de staff`);
  }

  // 3. Escritura con RLS (crear y borrar equipo de prueba)
  console.log('');
  console.log('== 3. Permisos de escritura (RLS) ==');
  const createRes = await fetch(`${url}/rest/v1/teams`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ name: SMOKE_NAME }),
  });
  const created = await createRes.json().catch(() => null);
  if (!createRes.ok) {
    fail(`no se pudo crear equipo (status ${createRes.status}): ${JSON.stringify(created)}`);
    console.log('        -> Ejecuta database/policies.sql (RLS) en Supabase.');
  } else {
    const id = Array.isArray(created) ? created[0]?.id : null;
    console.log(`  OK    escritura permitida (equipo temporal ${id})`);
    if (id) {
      const delRes = await fetch(`${url}/rest/v1/teams?id=eq.${id}`, {
        method: 'DELETE',
        headers,
      });
      if (delRes.ok) {
        console.log('  OK    equipo temporal eliminado (sin residuos)');
      } else {
        fail(`no se pudo borrar el equipo temporal (status ${delRes.status}); borralo a mano: ${SMOKE_NAME}`);
      }
    }
  }

  console.log('');
  if (failures === 0) {
    console.log('[smoke-auth] TODO OK');
    process.exit(0);
  }
  console.log(`[smoke-auth] ${failures} comprobacion(es) con fallo`);
  process.exit(1);
}

main().catch((err) => {
  console.error('[smoke-auth] Error inesperado:', err);
  process.exit(3);
});
