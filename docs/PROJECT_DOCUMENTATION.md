# UV3 Platform — Documentación Integral y Plan de Escalabilidad

> **Plataforma Digital Deportiva y Vecinal de la Unidad Vecinal 3**  
> *Versión del Documento: 1.0.0 — Octubre 2026*  
> *Stack: Next.js 15 (App Router) + React 19 + TypeScript + TailwindCSS v4 + Supabase (PostgreSQL / Auth / Storage / Realtime) + Vercel*

---

## 1. Resumen Ejecutivo del Proyecto

**UV3 Platform** es una solución integral diseñada para digitalizar la vida comunitaria y la gestión deportiva de la **Unidad Vecinal 3**. Resuelve dos necesidades esenciales en un solo ecosistema:
1. **Portal Comunitario Barrial:** Publicación de comunicados oficiales, avisos de la junta vecinal, campañas de salud, convocatorias y galería histórica/social.
2. **Sistema de Ligas y Campeonatos Deportivos:** Gestión integral de torneos (fútbol, fútbol sala, básquetbol), registro de equipos y jugadores (con control de DNI/edad), generación algorítmica automática de fixtures, actas arbitrales digitales con control de marcador en vivo y tablas de posiciones actualizadas en tiempo real.

---

## 2. Mapa de Integraciones y Ecosistema Cloud

```mermaid
graph TD
    A[Usuario / Vecino / Árbitro / Delegado] -->|HTTPS| B[Vercel CDN Edge Network]
    B --> C[Next.js 15 App Router Frontend]
    C -->|Server Actions / SSR / Auth| D[Supabase Backend]
    D --> E[(PostgreSQL Database + RLS)]
    D --> F[Supabase Auth - JWT / Cookies]
    D --> G[Supabase Storage - Fotos / Banners / Galería]
    D --> H[Supabase Realtime - Marcadores en Vivo]
    I[GitHub: bgrados/uv3] -->|CI/CD Git Push| B
```

* **Repositorio de Código:** [GitHub `bgrados/uv3`](https://github.com/bgrados/uv3)
* **Despliegue y Hosting:** [Vercel `uv3-platform`](https://vercel.com/ben-468d61e5/uv3-platform)
* **Base de Datos & Backend:** [Supabase `qhafedyvlwwzjzkwbvsu`](https://supabase.com/dashboard/project/qhafedyvlwwzjzkwbvsu)

---

## 3. Arquitectura del Repositorio

```text
uv3-platform/
├── .vercel/                  # Configuración de vinculación con Vercel
├── branding/                 # Manual de identidad visual y colores oficiales
│   └── design-system.md
├── database/                 # Scripts SQL para Supabase
│   ├── schema.sql            # Estructura de tablas, triggers, constraints e índices
│   ├── policies.sql          # Políticas de seguridad RLS (Row Level Security)
│   ├── seeds.sql             # Semillas con datos de prueba realistas
│   └── migration_sport.sql   # Migraciones modulares de esquemas
├── docs/                     # Documentación técnica y guías de arquitectura
│   └── PROJECT_DOCUMENTATION.md
├── frontend/                 # Aplicación Next.js 15
│   ├── public/               # Recursos estáticos, logos e iconografía
│   ├── src/
│   │   ├── app/              # App Router (páginas, layouts, server actions)
│   │   │   ├── (auth)/       # Rutas de login, registro, recuperación de clave
│   │   │   ├── actions/      # Server Actions (torneos, fixtures, equipos, jugadores)
│   │   │   ├── announcements/# Módulo de comunicados vecinales
│   │   │   ├── dashboard/    # Panel administrativo y control de arbitraje
│   │   │   │   ├── matches/  # Control de partidos y panel de marcador en vivo
│   │   │   │   └── tournaments/ # Administración y generador de fixtures
│   │   │   ├── gallery/      # Galería fotográfica vecinal
│   │   │   ├── teams/        # Directorio público de equipos y plantillas
│   │   │   ├── tournaments/  # Vistas públicas de torneos, fixtures y posiciones
│   │   │   ├── globals.css   # Variables CSS y tokens de diseño Tailwind v4
│   │   │   ├── layout.tsx    # Layout raíz con navbar y pie de página
│   │   │   └── page.tsx      # Portada principal comunitaria con datos dinámicos/fallbacks
│   │   ├── components/       # Componentes interactivos reutilizables (LiveMatchCard, etc.)
│   │   ├── types/            # Definiciones de tipos TypeScript compartidos
│   │   ├── utils/            # Motor de fixtures y clientes Supabase SSR/Browser
│   │   └── middleware.ts     # Control de sesiones y cookies SSR
│   ├── package.json
│   └── tsconfig.json
├── prompts/                  # Requerimientos originales y especificaciones funcionales
└── skills/                   # Directrices especializadas de diseño y base de datos
```

---

## 4. Módulos Funcionales Existentes

### 4.1. Motor Automático de Fixtures (`frontend/src/utils/fixtures.ts`)
* **Formato Liga (Round-Robin):** Algoritmo del círculo de rotación de Berger ($N-1$ fechas). Gestiona de forma nativa cantidades impares de equipos mediante equipos virtuales `BYE` (fecha de descanso).
* **Formato Eliminación Directa (Knockout):** Generación de llaves desde dieciseisavos/octavos/cuartos hasta la final, calculando potencias de 2 y pases directos (*byes*) cuando el número de participantes no es potencia perfecta.
* **Formato Mixto (Grupos + Playoff):** División configurable de equipos en grupos, generación de fixture interna por grupo y cruces posteriores para fases eliminatorias.
* **Asignación de Horarios y Sedes:** Vinculación con slots de disponibilidad (`schedules`) distribuyendo los partidos automáticamente por día y cancha.

### 4.2. Control de Arbitraje y Marcador en Vivo
* Interfaz táctil y responsiva (`MatchScoreControl.tsx`) diseñada para que árbitros o comisarios de mesa registren goles con un solo clic.
* Bitácora de incidencias cronológica local.
* Recálculo automático de la tabla de posiciones (`standings`) cuando el estado del partido pasa a `completed`.

### 4.3. Sistema de Autenticación y Autorización Granular (RBAC)
* Implementado con `@supabase/ssr` en Server Components y Server Actions.
* Roles del sistema:
  * `admin`: Acceso irrestricto a torneos, comunicados, usuarios, finanzas y configuración.
  * `organizer`: Creación y edición de campeonatos, generación de fixtures y asignación de árbitros.
  * `delegate`: Delegado de equipo; administra la plantilla de su equipo (jugadores, dorsales, fotos).
  * `referee`: Asignado a partidos específicos para cargar alineaciones, goles, tarjetas y resultado final.
  * `user`: Vecino o simpatizante general con acceso a consultar información, tablas, fotos y noticias.
* **Acceso al panel `/dashboard`:** sólo `admin`, `organizer` y `referee` (validado en `middleware.ts`, en el layout del panel y en cada Server Action). `delegate` tiene políticas RLS propias en la base de datos pero todavía no tiene interfaz dedicada: hoy la plantilla se administra desde el panel con el rol correspondiente. *Pendiente: portal del delegado.*

### 4.4. Portal de Noticias y Galería Multimedia
* Categorización de comunicados (`general`, `deportes`, `eventos`, `comunicado`).
* Álbumes de fotos con almacenamiento de URLs e integración de imágenes optimizadas mediante Next.js `Image`.

---

## 5. Diseño y Sistema Visual

Basado en la identidad histórica y comunitaria de la **Unidad Vecinal 3**:
* **Verde Principal:** `#14833B` — Vitalidad, naturaleza, campos deportivos.
* **Verde Oscuro:** `#0E5A28` — Contraste, barras de navegación y pie de página.
* **Dorado / Amarillo:** `#D8B400` — Campeonatos, medallas, acentos de alerta y destaques.
* **Fondo Claro:** `#F5F7F2` — Superficie limpia y descansada para lectura vecinal prolongada.
* **Tipografías:** `Inter` (cuerpo de texto de alta legibilidad en pantallas móviles) y `Poppins` (títulos modernos y enérgicos).

---

## 6. Diagnóstico y Recomendaciones para Escalar la Plataforma

Para llevar **UV3 Platform** de su estado actual a una plataforma de nivel profesional capaz de gestionar múltiples ligas simultáneas, miles de vecinos y tráfico concurrente durante finales o asambleas, se recomiendan las siguientes mejoras estructuradas en 6 ejes:

### Eje 1: Base de Datos y Rendimiento (PostgreSQL / Supabase)

> **Estado (MVP):** ya implementado en [`database/schema.sql`](file:///f:/uv3-platform/database/schema.sql): el trigger `recalculate_tournament_standings` actualiza `standings` de forma atómica tras cada cambio de `matches` y los índices críticos (incluidos `matches (tournament_id, round)`, `matches (status)` y `players (team_id, dni)`) están declarados en ese mismo archivo. Verificar con [`database/verify.sql`](file:///f:/uv3-platform/database/verify.sql).

1. **Vistas Materializadas o Tablas Agregadas para `standings`:**
   * *Situación actual:* La tabla de posiciones se recalcula o consulta con joins en tiempo real.
   * *Recomendación:* Implementar un trigger en PostgreSQL que actualice `standings` atómicamente tras el cierre de cada partido mediante una función `SECURITY DEFINER`, o usar una `MATERIALIZED VIEW` refrescada concurrentemente (`REFRESH MATERIALIZED VIEW CONCURRENTLY`).
2. **Estrategia de Índices Críticos:**
   * Crear índices compuestos en `matches (tournament_id, round)`, `matches (status)`, `players (team_id, dni)` y `standings (tournament_id, points DESC, goal_difference DESC)`.
3. **Control de Auditoría y Trazabilidad:**
   * Agregar una tabla `match_events` (minuto, jugador, equipo, tipo de gol o tarjeta, árbitro que lo registró) en lugar de depender únicamente de campos acumuladores. Esto permite estadísticas individuales detalladas (tabla de goleadores y arqueros menos batidos).

### Eje 2: Experiencia en Tiempo Real (Realtime WebSockets)

1. **Suscripción a Supabase Realtime en Partidos en Vivo:**
   * *Situación actual:* Se utiliza un polling periódico (`LiveAutoRefresh.tsx`) de 30 segundos.
   * *Recomendación:* Implementar canales WebSocket con `supabase.channel('public:matches')` para actualizar el marcador instantáneamente en los teléfonos de todos los vecinos cuando el árbitro presione el botón de gol, eliminando llamadas innecesarias al servidor.

### Eje 3: Gestión de Archivos y Multimedia (Supabase Storage)

> **Estado (MVP):** implementado en [`database/storage.sql`](file:///f:/uv3-platform/database/storage.sql): ya crea los buckets `team-logos`, `player-photos` y `tournament-banners` (públicos, con límite de tamaño y tipos MIME restringidos) y sus políticas RLS de lectura pública / escritura para roles administrativos. El panel de equipos ya sube escudos y fotos.

1. **Buckets Privados y Públicos con CDN:**
   * Configurar 3 buckets en Supabase Storage:
     * `team-logos` (público, con compresión WebP automática). **✔ creado en `storage.sql`**
     * `player-photos` (público/restringido, verificación de identidad por delegados). **✔ creado en `storage.sql`**
     * `community-gallery` (optimizado para álbumes fotográficos de alta resolución). *Pendiente.*
2. **Subida Directa desde el Cliente con Signed URLs:**
   * Implementar subidas seguras pre-firmadas para no saturar las Serverless Functions de Vercel con buffers de imágenes de alta resolución. *Pendiente: hoy la imagen viaja por Server Action (límite de 4 MB).*

### Eje 4: Experiencia Móvil y Modo Offline para Árbitros (PWA)

1. **Soporte PWA (Progressive Web App):**
   * Configurar `manifest.json` y Service Workers para que los delegados y vecinos puedan "instalar" UV3 como una app en Android e iOS sin pasar por las tiendas de aplicaciones.
2. **Módulo Offline-First para Árbitros en Cancha:**
   * En los campos de juego donde la señal 4G/5G suele degradarse, permitir que el árbitro cargue las incidencias en memoria local (IndexedDB) y se sincronicen automáticamente con Supabase en cuanto se recupere la conexión.

### Eje 5: Seguridad, Reglas de Negocio y Validación

1. **Validación de Elegibilidad de Jugadores:**
   * Regla de negocio en base de datos para impedir que un mismo jugador esté inscrito en dos equipos distintos en el mismo torneo.
   * Validación automática de suspensión por acumulación de tarjetas (ej. 2 amarillas en partidos consecutivos o 1 roja directa = 1 o más fechas de suspensión automática en la siguiente fecha del fixture).
2. **Protección de Rutas en Middleware:**
   * *Estado (MVP):* [`frontend/src/utils/supabase/middleware.ts`](file:///f:/uv3-platform/frontend/src/utils/supabase/middleware.ts) ya no autoriza por la cookie `uv3_session_role` (manipulable por el cliente). Ahora valida la sesión real de Supabase (`auth.getUser()`) y lee el rol desde `public.users`, bloqueando `/dashboard` salvo roles `admin`, `organizer` y `referee`. Además se eliminó el bypass de credenciales fijas en el login y el usuario sintético de `getCurrentUser()`.
   * *Pendiente:* cachear la consulta de rol (o exponerlo en el `app_metadata` del token) para evitar una llamada a la base por cada petición protegida.

### Eje 6: Integración Continua y DevOps

1. **Flujo de Migraciones con Supabase CLI:**
   * Versionar los cambios de base de datos en carpetas `supabase/migrations/` ejecutables automáticamente mediante GitHub Actions en cada Pull Request a `main`.
2. **Entornos de Staging en Vercel:**
   * Conectar ramas secundarias (ej. `develop` o PRs) a proyectos de staging en Supabase para probar nuevos torneos y funcionalidades sin afectar los datos en vivo de la junta vecinal.

---

## 7. Hoja de Ruta Sugerida (Roadmap de Implementación)

### 7.1. Estado del MVP (puesta en marcha)

| Trabajo | Estado | Evidencia / pendiente |
| :--- | :--- | :--- |
| Compilación limpia del frontend (`tsc`, `eslint`, `next build`) | **✔ Listo** | `npx tsc --noEmit`, `npm run lint`, `npm run build` sin errores |
| Corrección de tipos de autenticación | **✔ Listo** | `signInWithPassword` ahora devuelve `data` + `error` |
| Seguridad del acceso al panel | **✔ Listo** | Sin credenciales fijas en `auth/actions.ts`, sin usuario sintético y middleware con sesión real + rol desde `public.users` |
| Navegación del panel | **✔ Listo** | `dashboard/layout.tsx` con menú, rol visible y cierre de sesión |
| UI de equipos y jugadores | **✔ Listo** | `dashboard/teams` (alta/baja) y `dashboard/teams/[teamId]` (escudo, datos, plantilla CRUD con fotos) |
| Ficha pública de equipo | **✔ Listo** | `teams/[teamId]` con plantilla por posición (no expone DNI) |
| Asignación de árbitro por partido | **✔ Listo** | Selector en `dashboard/matches/[matchId]` dentro de "Programar partido" |
| Buckets y políticas de Storage | **✔ Listo (script)** | `database/storage.sql` (falta ejecutarlo en Supabase) |
| Verificación del esquema en Supabase | **⏳ Pendiente** | Ejecutar `database/verify.sql` en el SQL Editor |
| Claves reales en el entorno local | **⏳ Pendiente** | `vercel env pull frontend/.env.local` (hoy hay placeholders) |
| Primer despliegue validado | **⏳ Pendiente** | Publicar en Vercel una vez ejecutados los SQL |

### 7.2. Roadmap de producto (posterior al MVP)

| Fase | Duración Estimada | Entregables Principales |
| :--- | :--- | :--- |
| **Fase 1: Configuración & Enlace** | Inmediata | Carga de claves reales en `.env.local` y Vercel, ejecución de esquemas, políticas RLS y `storage.sql` en Supabase, verificación de primer inicio de sesión. |
| **Fase 2: Motor Deportivo Completo** | 1 - 2 semanas | Tabla de goleadores, sanciones automáticas por tarjetas, actas de partido en PDF descargables para delegados. |
| **Fase 3: Optimización Realtime & PWA** | 2 semanas | Suscripción WebSocket a partidos en vivo, configuración de Service Worker (PWA) e interfaz móvil optimizada para árbitros en cancha. |
| **Fase 4: Portal Comunitario Avanzado** | 2 semanas | Módulo de reservas de canchas comunales con horarios, votaciones vecinales y buzón de sugerencias a la junta directiva. |

---

*Documentación elaborada para el equipo de desarrollo de la Unidad Vecinal 3.*
