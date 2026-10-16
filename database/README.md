# Supabase Database Setup

Ejecuta los archivos en este orden desde el SQL Editor de Supabase:

1. `schema.sql` — tablas, relaciones, índices, triggers y automatizaciones.
2. `policies.sql` — reglas de seguridad RLS por tabla.
3. `storage.sql` — buckets de Storage (`team-logos`, `player-photos`, `tournament-banners`) y sus políticas.
4. `migration_sport.sql` — sólo si tu base ya existía antes de la columna `tournaments.sport`.
5. `verify.sql` — comprobación de que todo existe (no modifica nada). Todas las filas deben decir `OK`.
6. `seeds.sql` — **sólo para entornos de prueba**: borra los datos de varias tablas y carga usuarios, equipos, jugadores, partidos, comunicados y galería de ejemplo.

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
