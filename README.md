# RestHub · frontend

Interfaz web de RestHub: pedidos desde el celular del mesero, tablero de cocina
y caja, menú, mesas, inventario, personal y panel BI desde la laptop del
encargado. Consume el API de [resthub-backend](https://github.com/RestHubApp/resthub-backend)
bajo `/api/v1`. La documentación del producto vive en Notion.

## Stack

- React 19, Vite 8 y TypeScript 6 (rama 6, no 7).
- shadcn/ui sobre Radix y Tailwind CSS 4; iconos de Lucide.
- React Router en modo librería, TanStack Query y TanStack Table.
- React Hook Form + Zod para formularios, Zustand para el estado de cliente.
- Axios como cliente HTTP, con tipos generados por openapi-typescript.
- PWA instalable con vite-plugin-pwa (sin modo sin conexión).
- ESLint estricto (typescript-eslint, sonarjs, límites de arquitectura), Husky y lint-staged.
- pnpm 12 (fijado en `packageManager`).

## Cómo correrlo

Requisitos: Node 24 y pnpm (Corepack o `npm i -g pnpm`).

```bash
pnpm install
cp .env.example .env.local   # opcional: en desarrollo no hace falta ninguna variable
pnpm dev                     # http://localhost:5173
```

`pnpm dev` reenvía `/api` a `http://localhost:8000`, así que el backend tiene que
estar corriendo para que las pantallas tengan datos. Con la semilla de desarrollo
del backend se entra con `admin@resthub.dev` o `mesero@resthub.dev` y la
contraseña `resthub123`.

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm lint` | ESLint sobre todo el proyecto |
| `pnpm typecheck` | Verificación de tipos |
| `pnpm build` | Tipos y compilación de producción en `dist/` |
| `pnpm preview` | Sirve la compilación de producción |
| `pnpm generate:api` | Regenera `src/api/schema.d.ts` desde el OpenAPI del backend |

### Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_API_URL` | Origen del backend en producción, sin `/api/v1` (por ejemplo `https://api.resthub.pe`). Vacía en desarrollo. |
| `VITE_LOG_LEVEL` | Nivel mínimo de los logs del navegador. Por defecto `debug` en desarrollo y `warn` en producción. |

## Tipos del API

`src/api/schema.d.ts` se genera con openapi-typescript a partir de
`${VITE_API_URL:-http://localhost:8000}/api/v1/openapi.json` y **se versiona**,
para que el frontend compile sin el backend a mano.

```bash
pnpm generate:api                                      # contra el backend local
VITE_API_URL=https://api.resthub.pe pnpm generate:api  # contra otro backend
```

El script lee la variable de la terminal, no de `.env.local`. Después de
regenerar, `pnpm build` señala cada pantalla que quedó desalineada con el contrato.
Nadie edita el archivo generado: los alias legibles están en `src/api/types.ts`.

## Estructura

```
src/
  api/          contrato generado, alias de tipos y funciones por recurso (auth, staff…)
  components/   piezas compartidas; components/ui es código del CLI de shadcn
  features/     una carpeta por módulo: auth, shell, staff…
  hooks/        hooks compartidos sin dominio
  router/       rutas y guardas por permiso
  services/     cliente HTTP, logger, caché de consultas, reglas de campos
  store/        estado de cliente con Zustand (sesión, avisos)
  main.tsx      raíz de composición
```

La dirección de dependencia la hace cumplir ESLint (`eslint-plugin-boundaries`):
el router conoce a las características, las características no se importan
entre sí, y las capas compartidas no conocen el dominio. Las pantallas no
llaman a Axios: pasan por `src/services/api.ts` y por las funciones de `src/api/`.

La navegación sale de `src/features/shell/navigation.ts`: cada entrada declara
el permiso de `GET /auth/me` que la muestra. En pantallas anchas va en una barra
lateral; en el celular, en una barra inferior al alcance del pulgar.

## Convenciones

- Interfaz, mensajes y comentarios en español; identificadores en inglés.
- Un comentario solo va si dice algo que el código no puede decir.
- Commits en Conventional Commits en español (`feat(pedidos): …`). El hook
  `commit-msg` lo exige y rechaza las líneas `Co-authored-by`; `pre-commit`
  corre ESLint sobre lo preparado. CI repite lint y build en cada push.
