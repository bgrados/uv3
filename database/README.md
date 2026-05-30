# Supabase Database Setup

Ejecuta los archivos en este orden desde el SQL Editor de Supabase:

1. `schema.sql`
2. `policies.sql`
3. `seeds.sql` solo si quieres cargar datos de prueba

`schema.sql` crea las tablas principales, relaciones y automatizaciones.
`policies.sql` activa las reglas de seguridad.
`seeds.sql` borra datos de prueba anteriores y carga usuarios, equipos, jugadores, partidos, comunicados y galería de ejemplo.

No ejecutes `seeds.sql` en una base con datos reales, porque limpia varias tablas antes de cargar ejemplos.
