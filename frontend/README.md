# UV3 Platform — Frontend

Aplicación **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4** del
portal comunitario y de gestión deportiva de la **Unidad Vecinal 3**. Supabase actúa
como backend completo (Auth, PostgreSQL con RLS y Storage).

## Requisitos

- Node.js **22.x** (ver `package.json` → `engines` y `.nvmrc`).
- Un proyecto de Supabase con los scripts de `../database` aplicados.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completa las claves reales
npm run dev                  # http://localhost:3000
```

Variables de entorno (`.env.local`):

| Variable | Requerida | Descripción |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave pública (anon/publishable). |
| `NEXT_PUBLIC_SITE_URL` | Sí | URL pública del sitio (se usa en enlaces de correo). |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Solo tareas administrativas. No exponer. |
| `DATABASE_URL` | No | Conexión directa a PostgreSQL. |

## Scripts

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo (Turbopack). |
| `npm run build` | Compilación de producción. |
| `npm run start` | Sirve la build de producción. |
| `npm run lint` | ESLint. |
| `npm run check:db` | Verifica la conexión y los objetos de Supabase. |

## Estructura

```text
src/
├── app/
│   ├── (auth)/          # login, register, forgot-password, reset-password
│   ├── auth/
│   │   ├── actions.ts   # Server Actions de autenticación
│   │   └── callback/    # Intercambio de código (confirmación / recuperación)
│   ├── actions/         # Server Actions: torneos, fixtures, equipos, jugadores
│   ├── announcements/   # Comunicados vecinales
│   ├── dashboard/       # Panel administrativo (staff) y control de partidos
│   ├── gallery/         # Galería fotográfica
│   ├── teams/           # Directorio público de equipos y plantillas
│   ├── tournaments/     # Vistas públicas de torneos, fixture y posiciones
│   └── page.tsx         # Portada comunitaria
├── components/          # Componentes reutilizables (marcador en vivo, badges…)
├── types/               # Tipos TypeScript compartidos
└── utils/               # Motor de fixtures, clientes Supabase, roles
```

## Autenticación y roles

- **Panel `/dashboard`:** solo `admin`, `organizer` y `referee`.
- Los roles `delegate` (delegado de equipo) y `user` (vecino) no acceden al panel;
  las políticas RLS permiten al delegado administrar su equipo vía API.
- El flujo de recuperación de contraseña y la confirmación de correo pasan por
  `/auth/callback`, que intercambia el código por una sesión.

## No puedo entrar al panel (diagnóstico)

Antes de tocar código, comprueba el estado real con:

```bash
npm run check:db          # tablas, columnas y buckets
node scripts/smoke-auth.mjs                    # login admin@uv3.com / password123
node scripts/smoke-auth.mjs tu-correo tu-clave # login de tu cuenta real
```

Síntomas frecuentes y su causa:

| Síntoma | Causa | Solución |
| :--- | :--- | :--- |
| Login responde `500 Database error querying schema` | Cuentas demo con `auth.users`/`auth.identities` rotos | Ejecutar `../database/fix_all_admin_access.sql` |
| `check:db` avisa `FALTA tournaments.sport` y el panel da error 400 | Falta la columna `sport` | Mismo script |
| `FALTA team-logos / player-photos / tournament-banners` | Faltan los buckets de Storage | Mismo script |
| Login dice "Tu cuenta no tiene permisos para el panel" | Tu cuenta tiene rol `user` | Mismo script (promueve tu correo a `admin`) |

`../database/fix_all_admin_access.sql` es idempotente y se pega una sola vez en
el **SQL Editor de Supabase**. Si no recuerdas tu contraseña, usa antes
"¿Olvidaste tu clave?" en `/login`.

## Despliegue

Desplegado en Vercel. Configura las mismas variables de entorno en el proyecto y
aplica los scripts de `../database` en Supabase antes del primer uso.

Ver documentación completa en [`../docs/PROJECT_DOCUMENTATION.md`](../docs/PROJECT_DOCUMENTATION.md).
