# Shelly Monorepo

Monorepositorio que agrupa el backend de [Strapi](https://strapi.io/) y el frontend en [Next.js 13](https://nextjs.org/) con TypeScript y [shadcn/ui](https://ui.shadcn.com/). Todo el proyecto está listo para ejecutarse de forma local con SQLite y preparado para desplegarse en producción con PostgreSQL.

## Requisitos

- Node.js 18.18.0 (`.nvmrc` y `.node-version` incluidos).
- Yarn Classic (`npm install -g yarn`).
- SQLite3 instalado localmente (solo entorno de desarrollo).
- PostgreSQL 13+ disponible para el entorno de producción.
- Acceso a GitHub para gestionar este repositorio monorepo.

## Estructura del repositorio

```
.
├── apps
│   ├── backend   # Proyecto Strapi (API REST + autenticación JWT)
│   └── frontend  # Aplicación Next.js 13 (App Router + NextAuth)
├── package.json  # Configuración de workspaces
├── .nvmrc / .node-version
└── README.md
```

## Ejecución local

```bash
# Instala la versión correcta de Node
nvm use

# Instala dependencias de los paquetes
npm install -g yarn@1.22.19
yarn install --non-interactive
```

### Variables de entorno

#### Backend (`apps/backend/.env`)

Copia el archivo de ejemplo y completa los valores:

```bash
cp apps/backend/.env.example apps/backend/.env
```

| Variable | Descripción |
| --- | --- |
| `SHELLY_BASE_URL` | URL pública del backend. Úsala en el frontend y para webhooks. |
| `SHELLY_DEVICE_BASE_URL` | URL local o IP del dispositivo Shelly desde la que Strapi lee datos automáticamente. |
| `SHELLY_AUTH` | Modo de autenticación activo. El valor por defecto `strapi` habilita JWT. |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET` | Claves criptográficas que puedes generar con `yarn strapi keys:generate`. |
| `DATABASE_CLIENT` | `sqlite` para desarrollo (por defecto). |
| `STRAPI_POSTGRES_*` | Credenciales de la base de datos PostgreSQL en producción. |
| `STRAPI_JWT_EXPIRES_IN` | Vigencia del JWT emitido por Strapi. |

**Cómo obtener tokens de Strapi**

1. Ejecuta `yarn workspace shelly-backend develop` y completa el asistente para crear el primer usuario administrador.
2. Desde el panel de administración, ve a *Settings → API Tokens* y crea un *Full access token* si necesitas autenticar integraciones de servidor.
3. Para autenticación de usuarios finales, usa el endpoint `POST /api/auth/local` que devuelve `jwt` y los datos del usuario. Este flujo está integrado con NextAuth en el frontend.

#### Frontend (`apps/frontend/.env.local`)

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

| Variable | Descripción |
| --- | --- |
| `SHELLY_BASE_URL` | Coincide con la URL del backend (se usa para log-in y fetch server-side). |
| `SHELLY_API_TOKEN` | Token opcional para peticiones desde el servidor Next.js a Strapi (por ejemplo en rutas API). |
| `NEXTAUTH_URL` | URL del sitio Next.js. En desarrollo `http://localhost:3000`. |
| `NEXTAUTH_SECRET` | Cadena aleatoria larga para firmar sesiones (usa `openssl rand -base64 32`). |

## Scripts útiles

```bash
# Backend (Strapi)
yarn dev:backend       # Levanta Strapi en modo desarrollo (SQLite)

# Frontend (Next.js)
yarn dev:frontend      # Levanta el front en http://localhost:3000
```

Para construir Strapi para producción (PostgreSQL configurado):

```bash
cd apps/backend
yarn build
yarn start
```

Para generar el build de Next.js:

```bash
cd apps/frontend
yarn build
yarn start
```

## Automatización CI

El repositorio incluye dos pipelines de GitHub Actions que se ejecutan en cada *pull request* y en los pushes a `main`:

- **Backend CI** (`.github/workflows/backend-ci.yml`): instala las dependencias del monorepo y ejecuta `yarn workspace shelly-backend test` para verificar los servicios y utilidades de Strapi.
- **Frontend CI** (`.github/workflows/frontend-ci.yml`): realiza `next lint` y `vitest run` mediante `yarn workspace shelly-frontend lint` y `yarn workspace shelly-frontend test`.

Estos flujos utilizan la versión de Node definida en `.nvmrc` y Yarn 1.22.19 para alinear el entorno de CI con el desarrollo local.

## Sincronización de lecturas

Strapi ejecuta automáticamente la sincronización y agregación de lecturas mediante `config/cron-tasks.js`:

- Cada 5 minutos (`*/5 * * * *`) se invoca `strapi.service('api::reading.reading').fetchShellyData()` para obtener una nueva lectura del dispositivo configurado en `SHELLY_DEVICE_BASE_URL`.
- A los 10 minutos de cada hora (`10 * * * *`) se construyen resúmenes horarios.
- A las 00:20 (`20 0 * * *`) se generan resúmenes diarios.

Si prefieres coordinar la sincronización desde otra plataforma, puedes desactivar el cron interno y crear un webhook o un flujo programado (GitHub Actions Scheduled, Vercel Cron, etc.) que llame al endpoint autenticado de Strapi encargado de crear lecturas (`POST /api/readings`). Usa un API Token o JWT de administrador para autenticar la petición.

## Configuración de Strapi

- **Desarrollo**: usa SQLite automáticamente con la configuración de `config/env/development/database.js`.
- **Producción**: define las variables `STRAPI_POSTGRES_*` para conectar con PostgreSQL. El archivo `config/env/production/database.js` habilita TLS por defecto.
- **Plugins**: `users-permissions` viene configurado para emitir JWT. Ajusta la expiración mediante `STRAPI_JWT_EXPIRES_IN`.
- **Agregaciones energéticas**: Strapi ejecuta dos tareas programadas (`cron-tasks.js`) que calculan resúmenes horarios y diarios a partir de las lecturas en `readings`. Cada lectura se etiqueta automáticamente con la tarifa P1/P2/P3 correspondiente, respetando fines de semana y festivos configurados en la colección `holidays`. Los resultados se almacenan en las colecciones `hourly_summaries` y `daily_summaries` para consultas rápidas.
- **Tarifas configurables**: los periodos y precios de P1/P2/P3 se gestionan desde la colección `tariff_periods`. Cada registro define el código de tarifa, la franja horaria (`startTime`/`endTime`), los días de la semana a los que aplica y el precio (`rate`). Añade los festivos nacionales o regionales en `holidays` para forzar la aplicación de P3 en esas fechas. Puedes actualizar estos valores sin desplegar código: la lógica de cálculo consume los datos almacenados en la base de datos en cada ejecución del cron.

## Configuración de Next.js 13 + shadcn/ui

- Proyecto en TypeScript con App Router (`app/`).
- TailwindCSS y shadcn/ui incluidos (ejemplo de componente `Button`).
- Layout global incluye `SessionProvider` para NextAuth.
- Ruta protegida de ejemplo en `app/(protected)/dashboard` que requiere sesión válida.

## Flujo de autenticación (Strapi JWT + NextAuth)

1. El usuario inicia sesión desde Next.js (`signIn('credentials')`).
2. NextAuth llama a `POST {SHELLY_BASE_URL}/api/auth/local` con email y contraseña.
3. Strapi responde con `jwt` y datos del usuario.
4. El callback `jwt` de NextAuth guarda el token de Strapi dentro del token de sesión de NextAuth.
5. El callback `session` expone `session.jwt` y `session.user`. La UI los consume y los componentes server-side pueden usar `getServerSession`.
6. Para peticiones autenticadas, usa el helper `strapiFetch(path, { jwt: session.jwt })`, que añade el header `Authorization: Bearer <jwt>`.

## Despliegue

### Frontend (Next.js en Vercel)

1. Crea un proyecto en Vercel y conecta el repositorio.
2. Selecciona la ruta `apps/frontend` como directorio raíz. El comando de build por defecto (`yarn build`) y el de salida (`yarn start`) funcionan sin cambios.
3. Define las variables de entorno (`SHELLY_BASE_URL`, `SHELLY_API_TOKEN`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`). Para entornos previos, usa [Environment Variables Encryption](https://vercel.com/docs/projects/environment-variables).
4. Habilita [Deploy Hooks](https://vercel.com/docs/deployments/deploy-hooks) si necesitas publicar el frontend tras finalizar los tests.
5. Consulta los logs y métricas desde la pestaña *Observability* de Vercel o configura integraciones con DataDog/New Relic.

### Backend (Strapi)

Tienes dos alternativas principales:

- **Vercel Serverless**: Crea un proyecto nuevo apuntando a `apps/backend`. Añade un `vercel.json` con funciones serverless (build `yarn build`, output en `.vercel/output`). Configura PostgreSQL gestionado (Vercel Postgres o Neon) y las claves `APP_KEYS`, `API_TOKEN_SALT`, etc. La sincronización de cron seguirá activa gracias a la capa de *Background Functions* de Vercel.
- **Proveedor externo (Render, Fly.io, Railway, etc.)**: Despliega el contenedor ejecutando `yarn build && yarn start`. Adjunta una base de datos PostgreSQL gestionada (Render PostgreSQL, Supabase, ElephantSQL...). Asegúrate de exponer `SHELLY_DEVICE_BASE_URL` y, si el dispositivo no es accesible desde Internet, crea un túnel seguro (por ejemplo, WireGuard o Tailscale) o despliega Strapi en la misma red.

En ambos casos agrega un mecanismo de backup automático de la base de datos y habilita HTTPS con certificados gestionados por la plataforma.

## Monitoreo y alertas

- **Logs de producción**: Vercel y la mayoría de PaaS ofrecen streaming en tiempo real y exportación. Configura alertas de error (HTTP 5xx, tiempo de build) y quota en Vercel; para Strapi en Render/Fly usa agregadores como LogDNA, Papertrail o Loki.
- **Salud del cron de lecturas**: añade un monitor de *heartbeat* (Better Stack, Healthchecks.io) que vigile las ejecuciones cada 5 minutos. El monitor debe alertar cuando no se reciban *pings* desde el cron (`strapi.log.info` o webhook) durante más de 10 minutos.
- **Métricas de negocio**: expón dashboards en el frontend consumiendo `hourly_summaries` y `daily_summaries`. Puedes conectar Vercel Analytics o una integración de Segment para correlacionar tráfico y consumo energético.
- **Alertas de base de datos**: utiliza las herramientas del proveedor gestionado (Postgres) para crear alarmas de espacio, conexiones y errores de replicación. Complementa con copias de seguridad automáticas y restauraciones periódicas de prueba.

## Licencia

MIT
