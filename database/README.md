# Supabase Database Setup

> **¿No puedes entrar al panel `/dashboard`?** Ejecuta **`fix_all_admin_access.sql`**
> en el SQL Editor de Supabase. Es un único script idempotente que arregla de una
> vez: el login roto de las cuentas demo (error 500), la columna
> `tournaments.sport` que falta, los buckets de Storage, la promoción de tu
-- cuenta a `admin` y el endurecimiento del trigger de registro. No borra datos.

Ejecuta los archivos en este orden desde el SQL Editor de Supabase:

1. `schema.sql` — tablas, relaciones, índices, triggers y automatizaciones. **Ya incluye la columna `tournaments.sport`.**
2. `policies.sql` — reglas de seguridad RLS por tabla. Es idempotente.
3. `storage.sql` — buckets de Storage (`team-logos`, `player-photos`, `tournament-banners`) y sus políticas. Es idempotente.
4. `migration_sport.sql` — **sólo si tu base se creó antes de que `sport` formara parte de `schema.sql`** (es idempotente, así que ejecutarlo por defecto nunca hace daño). En bases nuevas ya no es necesario.
5. `verify.sql` — comprobación de que todo existe (no modifica nada). Todas las filas deben decir `OK`.
6. `seeds.sql` — **sólo para entornos de prueba**: borra los datos de varias tablas y carga usuarios, equipos, jugadores, partidos, comunicados y galería de ejemplo.
7. `fix_demo_users.sql` — **repara las cuentas demo** si ya existían y no pueden iniciar sesión (ver más abajo). No borra datos.
8. `grant_admin.sql` — **promueve tu propia cuenta a `admin`** si te registraste con rol `user` y no puedes entrar al panel. Cambia el correo. No borra datos.

> Si sólo necesitas poner al día una base ya creada, pega `apply_pending.sql`
> (contiene `policies.sql` + `migration_sport.sql` + `storage.sql` +
> `fix_demo_users.sql`) y, si tu cuenta quedó como `user`, además `grant_admin.sql`.
>
> Atajo recomendado: `fix_all_admin_access.sql` reúne todo lo anterior **más**
> la promoción de tu cuenta a `admin` y el endurecimiento del trigger de
> registro, en un solo paso.

## No puedo iniciar sesión

Hay **dos causas distintas** y se arreglan en el SQL Editor de Supabase:

**A) Al entrar responde `500 Database error querying schema`** (típico con las
cuentas demo). Ocurre cuando las cuentas demo se crearon insertando a mano en
`auth.users` y quedaron con columnas de token en `NULL` y/o sin su fila en
`auth.identities`. Solución: ejecuta `fix_demo_users.sql` (normaliza las filas,
crea las identidades y fija la contraseña `password123`). Es seguro re-ejecutarlo.

**B) El login responde "Tu cuenta no tiene permisos para el panel
administrativo".** La cuenta existe y la contraseña es correcta, pero su rol en
`public.users` es `user` (vecino). El panel `/dashboard` sólo admite `admin`,
`organizer` y `referee`. Esto es lo que pasa con las cuentas creadas desde el
registro público. Solución: ejecuta `grant_admin.sql` (cambia el correo por el
tuyo) para promover tu cuenta.

> Nota: el registro público crea cuentas con rol `user`, que **no** tienen acceso
> al panel. Los roles se asignan desde el SQL Editor (o, a futuro, desde un
> módulo de administración de usuarios).

## Cuentas de prueba (sólo tras ejecutar `seeds.sql`)

| Rol | Correo | Clave |
| :--- | :--- | :--- |
| Administrador | `admin@uv3.com` | `password123` |
| Organizador | `organizador@uv3.com` | `password123` |
| Delegado | `delegado1@uv3.com` | `password123` |
| Árbitro | `arbitro@uv3.com` | `password123` |
| Vecino | `vecino@uv3.com` | `password123` |

> Cambia estas claves antes de usar la plataforma con datos reales.

## Notas

- No ejecutes `seeds.sql` en una base con datos reales.
- Sólo los roles `admin`, `organizer` y `referee` pueden entrar al panel `/dashboard`.
- Los delegados pueden administrar su propio equipo y su plantilla, pero no acceden al panel administrativo.
