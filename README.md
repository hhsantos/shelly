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

## Instalación

```bash
# Instala la versión correcta de Node
nvm use

# Instala dependencias de los paquetes
yarn install
```

## Variables de entorno

### Backend (`apps/backend/.env`)

Copia el archivo de ejemplo y completa los valores:

```bash
cp apps/backend/.env.example apps/backend/.env
```

| Variable | Descripción |
| --- | --- |
| `SHELLY_BASE_URL` | URL pública del backend. Úsala en el frontend y para webhooks. |
| `SHELLY_AUTH` | Modo de autenticación activo. El valor por defecto `strapi` habilita JWT. |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET` | Claves criptográficas que puedes generar con `yarn strapi keys:generate`. |
| `DATABASE_CLIENT` | `sqlite` para desarrollo (por defecto). |
| `STRAPI_POSTGRES_*` | Credenciales de la base de datos PostgreSQL en producción. |
| `STRAPI_JWT_EXPIRES_IN` | Vigencia del JWT emitido por Strapi. |

**Cómo obtener tokens de Strapi**

1. Ejecuta `yarn workspace shelly-backend develop` y completa el asistente para crear el primer usuario administrador.
2. Desde el panel de administración, ve a *Settings → API Tokens* y crea un *Full access token* si necesitas autenticar integraciones de servidor.
3. Para autenticación de usuarios finales, usa el endpoint `POST /api/auth/local` que devuelve `jwt` y los datos del usuario. Este flujo está integrado con NextAuth en el frontend.

### Frontend (`apps/frontend/.env.local`)

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

## Configuración de Strapi

- **Desarrollo**: usa SQLite automáticamente con la configuración de `config/env/development/database.js`.
- **Producción**: define las variables `STRAPI_POSTGRES_*` para conectar con PostgreSQL. El archivo `config/env/production/database.js` habilita TLS por defecto.
- **Plugins**: `users-permissions` viene configurado para emitir JWT. Ajusta la expiración mediante `STRAPI_JWT_EXPIRES_IN`.

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

- **Backend**: Configura variables `APP_KEYS`, `API_TOKEN_SALT`, etc. y proporciona las credenciales de PostgreSQL. Ejecuta `yarn build` seguido de `yarn start`.
- **Frontend**: Compila con `yarn build` y despliega en tu plataforma preferida (Vercel, etc.). Define las variables de entorno (`SHELLY_BASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`).

## Licencia

MIT
