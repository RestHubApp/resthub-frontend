# RestHub · frontend

Interfaz web de RestHub: pedidos desde el celular del mesero, tablero de cocina
y caja, menú, mesas, inventario, personal, roles y panel BI desde la laptop
del encargado, y el área de administración del sistema para el equipo de
RestHub. Consume el API de [resthub-backend](https://github.com/RestHubApp/resthub-backend)
bajo `/api/v1`. La documentación del producto vive en Notion.

## Stack

- React 19, Vite 8 y TypeScript 6 (rama 6, no 7).
- shadcn/ui sobre Radix y Tailwind CSS 4; iconos de Lucide.
- React Router en modo librería, TanStack Query y TanStack Table.
- React Hook Form + Zod para formularios, Zustand para el estado de cliente.
- `openapi-fetch` como cliente HTTP, tipado de punta a punta con los tipos que genera openapi-typescript.
- PWA instalable con vite-plugin-pwa; sin señal, el mesero puede tomar pedidos nuevos (ver abajo).
- ESLint estricto (typescript-eslint, sonarjs, límites de arquitectura), Husky y lint-staged.
- Jest 30 con React Testing Library para las reglas puras (cuentas del cobro, opciones, compras, horas, sesiones) y las pantallas.
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
contraseña `resthub123`; a la administración del sistema se entra por el mismo
acceso (`/acceso`), con `plataforma@resthub.dev` y la misma contraseña: el
servidor decide qué cuenta es y la interfaz solo muestra lo que sus permisos
dejan.

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm lint` | ESLint sobre todo el proyecto |
| `pnpm typecheck` | Verificación de tipos |
| `pnpm test` | Pruebas unitarias y de componentes con Jest (`*.test.ts(x)` junto al código) |
| `pnpm test:coverage` | Las mismas pruebas con cobertura sobre todo `src` (informe HTML en `coverage/lcov-report/`) |
| `pnpm test:contract` | Pruebas de contrato del consumidor con Pact (`src/api/contract/*.pact.ts`): escriben `pacts/`, que el backend verifica |
| `pnpm test:mutation` | Pruebas de mutación con Stryker sobre la lógica de negocio (informe en `reports/mutation/index.html`; no corre en el CI) |
| `pnpm build` | Tipos y compilación de producción en `dist/` |
| `pnpm preview` | Sirve la compilación de producción |
| `pnpm generate:api` | Regenera `src/api/schema.d.ts` desde el OpenAPI del backend |
| `pnpm run doctor` | React Doctor (corrección, rendimiento, seguridad y accesibilidad de React) con `--no-score`; falla ante cualquier hallazgo. Se escribe `pnpm run doctor` porque `pnpm doctor` es un comando de pnpm. Exclusiones y motivos en `doctor.config.jsonc` |
| `pnpm carbon` | Huella de carbono de la primera visita de cada ruta, en modo estático (tamaño comprimido según el manifest de Vite); falla si una ruta baja de A+ |
| `pnpm carbon:browser` | Lo mismo midiendo con Chromium los bytes que viajan (el del CI) |
| `pnpm test:e2e` | Pruebas E2E con Playwright contra el backend de develop (job `e2e` del CI). Ver `e2e/README.md` |
| `pnpm test:visual:ci` | Regresión visual de Chromium (escritorio y celular); el CI la corre en la imagen de Playwright (job `visual`) |
| `pnpm test:visual` | Regresión visual en los tres navegadores; Firefox y WebKit solo en local |
| `pnpm test:visual:update` | Regenera las líneas base de Chromium dentro de la imagen de Playwright (docker o podman). Ver `e2e/README.md` |
| `pnpm a11y [axe] [keyboard] …` | Revisión de accesibilidad de cada ruta y modal con la sesión de cada rol (`checks/accessibility/`). Con `A11Y_STRICT=1` falla ante violaciones serious o critical de axe; el job `con-sesion` del CI corre `pnpm a11y axe keyboard` así |

### Pruebas

Jest corre sin Vite: Babel compila TypeScript y JSX, y `jest.config.js` resuelve
lo que en la aplicación resuelve Vite (`import.meta.env`, el alias `@/`, los
estilos y los módulos virtuales de la PWA). La infraestructura de las pruebas
está en `jest/`.

- Las pruebas importan `describe`, `it`, `expect` y `jest` de `@jest/globals`.
- El entorno por defecto es jsdom, para las pruebas de componentes con React
  Testing Library (`render`, `screen`, `userEvent`) y los matchers de jest-dom.
- Las pruebas de pantallas usan el arnés `#jest/harness`: `montar(<Vista />)`
  la abre con un router en memoria y el caché de la aplicación, `entrarComo()`
  abre una sesión con los permisos dados y `servidor().on('get', '/ruta', datos)`
  responde el API (`llamadas()` dice qué se envió; los parámetros de la consulta llegan como texto).
  El canal de avisos (SSE) falso está en `#jest/channel` y los datos de prueba
  en `jest/fixtures/`.
- La red de las pruebas es MSW (`jest/mswServer.ts`, `setupServer` de `msw/node`,
  encendido en `jest/setupDom.ts` con `onUnhandledRequest: 'error'` y reseteado
  tras cada prueba): se ejercita el cliente real (`openapi-fetch`,
  `src/services/api.ts`) y solo la red es falsa. El arnés, `answerAll` y el
  canal de avisos son manejadores de MSW. Para una respuesta tipada con el
  contrato, `apiHttp` de `#jest/apiHttp` (`openapi-msw`): la ruta y el cuerpo
  deben existir en `schema.d.ts`. ESLint prohíbe `jest.mock` de `@/api/*` y de
  `@/services/api` en las pruebas (`MOCKS_OF_API_ALLOWED` en `eslint.config.js`
  guarda las excepciones por archivo, con su motivo; hoy no hay).
  Detalles de entorno: `jest.config.js` usa `customExportConditions: ['']` para
  que `msw/node` resuelva su versión de Node; `jest/jsdomEnvironment.cjs` copia
  `fetch` y las clases de la API fetch de Node; las dependencias ESM de MSW
  se transforman con Babel (`onlyEsm`). Con temporizadores falsos de Jest, no se
  falsean `setImmediate`, `nextTick` ni `queueMicrotask`
  (`jest.useFakeTimers({ doNotFake: [...] })`) o MSW responde 500.
- Los errores del servidor son `{ detail, code }`. `ApiError.code` es el
  `ErrorCode` del esquema y toda decisión (reintentar, cerrar sesión, «mesa
  ocupada», conflicto de nombre…) usa `hasCode`, `isSessionEnded` o
  `isUnreachable` de `services/apiError`; el `detail` solo se muestra
  (`errorMessage`). ESLint prohíbe comparar el texto del error.
- Las pruebas que simulan una pestaña sin DOM (reemplazan `window`, `location`
  o el almacenamiento) declaran `@jest-environment ./jest/nodeEnvironment.cjs`
  y usan `stubGlobal` y `unstubAllGlobals` de `#jest/globals`.
- Si cambia `jest/importMetaEnv.cjs`, hay que vaciar la caché con
  `pnpm exec jest --clearCache`: Jest no la invalida sola.

La mutación (`stryker.config.mjs`) muta `services`, `store` y las utilidades
puras de `features` (no los componentes, los hooks `use*.ts` ni las precargas),
con tres procesos y en modo incremental. Falla por debajo de 70 %
(`thresholds.break`). Tarda del orden de una hora la primera vez, por eso no
está en el CI.

### Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_API_URL` | Origen del backend en producción, sin `/api/v1` (por ejemplo `https://api.resthub.pe`). Vacía en desarrollo. Al compilar con ella, la CSP limita `connect-src` a la propia aplicación y a ese origen. **Defínela en Vercel** o `connect-src` queda abierto a cualquier https. |
| `VITE_LOG_LEVEL` | Nivel mínimo de los logs del navegador. Por defecto `debug` en desarrollo y `warn` en producción. |

## Tipos del API

`src/api/schema.d.ts` se genera con openapi-typescript a partir de
`${VITE_API_URL:-http://localhost:8000}/api/v1/openapi.json` y **se versiona**,
para que el frontend compile sin el backend a mano.

```bash
pnpm generate:api                                      # contra el backend local
VITE_API_URL=https://api.resthub.pe pnpm generate:api  # contra otro backend con DEBUG=true (con DEBUG=false el esquema no se publica)
```

El script lee la variable de la terminal, no de `.env.local`. Después de
regenerar, `pnpm build` señala cada pantalla que quedó desalineada con el contrato.
Nadie edita el archivo generado: los alias legibles están en `src/api/types.ts`.

Los del API de plataforma (`/platform/*`) siguen la misma regla: sus esquemas
llevan `Platform` delante cuando el nombre chocaría con uno del restaurante
(`PlatformUpdateRestaurantRequest`).

## Estructura

```
src/
  api/          contrato generado, alias de tipos y funciones por recurso (auth, staff, platform…)
  components/   piezas compartidas; components/ui es código del CLI de shadcn y
                components/charts, los gráficos SVG propios (panel BI y observabilidad)
  features/     una carpeta por módulo: auth, shell, staff, platform…
  hooks/        hooks compartidos sin dominio
  router/       rutas y guardas por permiso
  services/     cliente HTTP, logger, caché de consultas, reglas de campos
  store/        estado de cliente con Zustand (la sesión, del personal o de plataforma, y los avisos)
  main.tsx      raíz de composición
scripts/        herramientas de línea de comandos (huella de carbono, fuente recortada)
```

La dirección de dependencia la hace cumplir ESLint (`eslint-plugin-boundaries`):
el router conoce a las características, las características no se importan
entre sí, y las capas compartidas no conocen el dominio. Las pantallas no
llaman a `openapi-fetch` ni a `fetch`: pasan por `src/services/api.ts` y por las funciones de `src/api/`.

La navegación sale de `src/features/shell/navigation.ts`: cada entrada declara
el permiso de `GET /auth/me` que la muestra. En pantallas anchas va en una barra
lateral; en el celular, en una barra inferior al alcance del pulgar.

## Huella de carbono y peso de la primera visita

Una persona nueva paga con sus datos y el planeta lo que baja en la primera
visita. La meta es la nota **A+** de [websitecarbon.com](https://www.websitecarbon.com/)
(Sustainable Web Design v4, hasta 0,040 g de CO2e, unos 270 kB transferidos) en
el acceso, el resto de las rutas públicas y la pantalla principal del mesero
(Pedidos). `scripts/carbon.ts` lo comprueba y el CI falla si una ruta baja de A+:

```bash
pnpm carbon                # modo estático: compila a dist-carbon/ y suma el tamaño
                           # comprimido (brotli) de lo que carga cada ruta según el
                           # manifest de Vite, más lo que descarga el service worker.
                           # Es una cota inferior: no ve lo que el código pide después
pnpm carbon:browser        # modo navegador (el del CI): sirve la compilación con
                           # `vite preview` y mide con Chromium los bytes que viajan
                           # (cuerpo comprimido y cabeceras), esperando 10 s tras `load`
pnpm carbon --verbose      # lista los archivos que más pesan de cada ruta
```

Cada visita es de un contexto nuevo (sin caché). La del mesero entra con una
sesión de prueba y el API responde datos vacíos: sus bytes no se cuentan. Si
Chromium no arranca en WSL (falta `libnspr4`), `pnpm carbon` no lo necesita; para
el modo navegador se pueden extraer las librerías sin `sudo` como se explica en
`e2e/README.md` (`apt-get download libnspr4 libnss3 libasound2t64`,
`dpkg-deb -x` y `LD_LIBRARY_PATH`).

Lo que mantiene la primera visita liviana:

- **El acceso no carga Zod ni React Hook Form.** Su validación es de
  `services/credentialRules.ts` y la usa el acceso, que es uno solo; el
  resto de formularios siguen con Zod.
- **El widget de accesibilidad (Sienna, 20 kB) se baja al tocar su botón.** La
  página dibuja un botón propio, igual al del widget, que lo importa y abre su
  menú (`components/AccessibilityWidget.tsx`).
- **La fuente es la Geist de 400 a 900 en Latin-1** (19 kB, no 29 kB):
  `bash scripts/subsetFont.sh` la regenera desde `@fontsource-variable/geist`.
- **El archivo inicial es uno solo** (`shell` en `vite.config.ts`): cada archivo
  de más es una petición con ~1 kB de cabeceras de seguridad.
- **El service worker precachea solo el armazón** (lo que enlaza `index.html`:
  8 archivos, no los 123 de antes (casi todas las pantallas y bibliotecas)). Cada pantalla se
  guarda la primera vez que se abre (`runtimeCaching`, con `clientsClaim` para
  que lo haga desde la primera sesión) y, para no romper el modo sin señal, al
  entrar con sesión y tres segundos después de que el service worker está
  listo se bajan las pantallas que el mesero necesita sin conexión
  (`offline: true` en `router/screens/ordersScreens.ts`,
  `features/shell/useOfflineWarmup.ts`; los archivos que la página ya había
  bajado antes de que el service worker tomara el control los guarda
  `services/screenCache.ts`). Ese paquete sin señal (Pedidos, pedido nuevo,
  detalle y agregar platos: ~65 kB con cabeceras, `pnpm carbon` lo imprime) se
  baja una vez por celular y solo con sesión; el modo navegador de `pnpm carbon`
  bloquea el service worker y no lo cuenta en la nota. Recargar la app sin
  señal sigue funcionando; lo que ya no pasa es pagar, en la primera visita al
  acceso, las pantallas de administración que nunca se abrirán.

## Formatos, zona horaria y carga

- Soles, porcentajes, cantidades de insumo (g → kg, ml → L), fechas y horas
  salen de un solo módulo, `src/services/format.ts`. Ninguna pantalla crea su
  propio `Intl.NumberFormat`.
- "Hoy" y las horas son las del restaurante (`restaurant.timezone` de
  `GET /auth/me`, con `useTimeZone()`), no las del navegador de quien mira.
- Todas las pantallas, incluso acceso y pedidos, se descargan al abrirlas
  (`lazy` en `src/router/screens.ts` y `src/router/routes.tsx`): el archivo inicial no trae formularios
  de Zod y React Hook Form ni la toma de pedidos. Si el archivo de una pantalla
  no llega, `router/RouteError.tsx` la reemplaza por un aviso con «Recargar».
- La precarga comienza con intención de navegación: al pasar el puntero,
  enfocar o tocar un enlace del menú se adelanta el código y la consulta de
  esa pantalla. No se descargan en segundo plano todas las pantallas al
  entrar, para dejar CPU y red al primer render. Las rutas y la precarga
  salen de la misma lista de `import()` del router; cada consulta se define
  una vez con `queryOptions` en `src/api/` y la usan la vista y la precarga.
- Después de guardar, las pantallas ponen en el caché lo que devolvió el
  servidor y releen de fondo, sin esperar ese segundo viaje para mostrar el
  cambio. Mientras carga una lista se ve su silueta, no un «Cargando…».

## Personal, roles y permisos

- Cada restaurante tiene sus roles: el encargado (fijo, con todos los
  permisos), el mesero (rol base: sus permisos se cambian, su nombre no) y los
  que arme el local, como cocina o caja. La interfaz nunca pregunta por el
  rol: pregunta por permisos (`useCan`), así que cambiar los permisos de un
  rol cambia el menú y las pantallas de quien lo tiene.
- «Roles» (`/roles`, `roles.manage`, `features/roles`): la lista de roles con
  cuántas personas tienen cada uno y un resumen de lo que pueden hacer. El
  formulario muestra el catálogo de `GET /permissions` en casillas por grupo;
  los permisos que la cuenta no tiene aparecen apagados, porque nadie da lo
  que no tiene. Un rol personalizado sin personas se puede borrar.
- «Personal» (`staff.manage`) elige el rol de cada cuenta entre los de
  `GET /roles`, y solo ofrece los que la cuenta puede dar. Una cuenta cuyo rol
  tiene permisos que faltan se ve, pero no se edita. Nadie cambia su propio
  rol.
- Al guardar el rol propio se relee `GET /auth/me` en el momento. A quien
  tiene el rol le llega el aviso `permissions`, que relee su sesión mientras
  mira una pantalla en vivo (pedidos, tablero, cocina); en las demás, la
  sesión se relee cada cinco minutos.

## Administración del sistema (`/plataforma`)

El equipo de RestHub no pertenece a ningún restaurante: da de alta locales y
su primer encargado, y los activa o desactiva. Usa **la misma aplicación** que
el personal de un local: el mismo acceso (`/acceso`), el mismo armazón (menú
lateral en la laptop y barra inferior en el celular), la misma guarda de
rutas y el mismo registro de pantallas. Lo único que cambia es qué se muestra,
según los permisos de la cuenta. Las pantallas viven en `features/platform` y
se declaran en `src/router/screens/platformScreens.ts`, cada una con su
permiso `platform.*` y su entrada de menú; se descargan aparte, así que el
celular del mesero nunca baja este código.

| Ruta | Permiso | Pantalla |
|---|---|---|
| `/plataforma/acceso` | | Ya no hay otro acceso: redirige a `/acceso`. |
| `/plataforma` | `platform.restaurants.read` | Restaurantes, los más nuevos primero, con búsqueda por nombre o identificador y paginación del servidor (25 por página). Es el inicio de una cuenta de plataforma. |
| `/plataforma/restaurantes/nuevo` | `platform.restaurants.manage` | Alta del restaurante (nombre, identificador, zona horaria) y de su primer encargado. |
| `/plataforma/restaurantes/:id` | `platform.restaurants.read` | Ficha: nombre y zona horaria editables, activar o desactivar, encargados y «Agregar encargado». |
| `/plataforma/bitacora` | `platform.activity.read` | Bitácora de lo que hizo cada administrador. |
| `/plataforma/vista-previa` | `platform.preview.open` | El local de muestra y «Ver como encargado» / «Ver como mesero» (ver abajo). |
| `/plataforma/observabilidad` | `platform.observability.read` | Panel de observabilidad: tráfico, errores, latencias, rutas y logs del backend (ver abajo). |

- **Una sola sesión.** `store/session.ts` guarda la respuesta de `POST
  /auth/login` tal como viene, discriminada por `kind`: `staff` (usuario,
  restaurante, permisos del local, términos) o `platform` (administrador y sus
  permisos `platform.*`), en `resthub.session.v3`. Un navegador tiene una sola
  cuenta abierta; entrar con otra reemplaza la anterior. Lo que es del
  restaurante (aceptar los términos, la cola sin señal y su precarga, el canal
  de avisos, el nombre del local, la zona horaria, cambiar la contraseña) corre
  solo con `kind === 'staff'` (`useStaffAccount`). Las sesiones guardadas antes
  de `kind` se leen como del personal. El catálogo `platform.*` es aparte del de
  un restaurante (`PLATFORM_PERMISSION` en `api/permissions.ts`): un encargado
  nunca los recibe.
- **Una sola guarda.** `RequireSession permission=…` mira el permiso de cada
  pantalla; sin sesión lleva a `/acceso` y sin permiso al inicio de la cuenta,
  que es la primera pantalla que sus permisos abren (para plataforma,
  Restaurantes). El menú muestra solo lo permitido (`entriesFor`). El
  encabezado dice el nombre del restaurante para el personal y
  «Administración del sistema» para plataforma.
- El cliente HTTP manda el token de la sesión abierta a todo el API y a ningún
  otro origen; cuáles rutas acepta cada clase de cuenta lo decide el servidor
  (un token de plataforma no sirve en el restaurante ni al revés). Un 401
  cierra la sesión y cerrarla vacía el caché y las mutaciones enteros.
- **El token no se guarda en el navegador (S2).** Vive en memoria; lo guardado
  es la cuenta, una marca del inicio de sesión y cuándo vence. El servidor deja
  además la sesión en una cookie `HttpOnly` (`resthub_session` o
  `resthub_platform_session`) que un script no puede leer, y cada petición
  viaja con credenciales (`credentials: 'include'`). Al recargar,
  `useSessionRenewal` recupera el token: `GET /auth/me` con la cookie da el
  valor anti-CSRF y `POST /auth/refresh` con `X-CSRF-Token`, un token nuevo.
  Mientras tanto las pantallas leen con la cookie. Lo que cambia algo lleva
  `X-CSRF-Token`; si el servidor responde `csrf_token_invalid` (otra pestaña
  renovó la cookie) se relee y se repite una vez. Si el navegador bloquea la
  cookie (cookies de terceros), la sesión dura lo que la pestaña: al recargar
  pide entrar de nuevo. Un 401 al token de la pestaña (otra pestaña cambió la
  contraseña y lo cortó) primero prueba la cookie; solo sin ella se cierra la
  sesión. La vista previa no tiene cookie: guarda su token en su pestaña. Las
  mutaciones que llevan una contraseña (alta, nuevo encargado) salen del
  caché en cuanto nadie mira su resultado (`gcTime: 0`).
- Vence y se renueva igual para las dos clases (`hooks/useTokenRenewal.ts`,
  `POST /auth/refresh` cinco minutos antes) y se relee con `GET /auth/me`.
- **Identificador (slug):** se sugiere del nombre (minúsculas, sin tildes,
  guiones) y sigue al nombre hasta que alguien lo edita; se valida como el
  backend, `^[a-z0-9]+(-[a-z0-9]+)*$`, hasta 60 caracteres. No se cambia
  después del alta.
- **Zona horaria:** una lista de zonas IANA comunes con Lima primero
  (`timeZones.ts`); la ficha agrega la zona guardada si no está en la lista.
  La valida `Intl` (con sus alias, como `GMT` o `EST5EDT`), y en la ficha solo
  si cambió: una zona guardada que el navegador no conoce no impide renombrar.
- **Ficha:** sigue a la relectura sin perder lo que se está escribiendo, y al
  guardar manda solo los campos que se editaron: no pisa lo que otro
  administrador cambió mientras tanto.
- Desactivar se confirma y explica que corta al instante el acceso de todo el
  personal del local; activar va directo. Las horas del área son las de Lima.

### Vista previa como encargado o mesero

Para depurar, el administrador abre RestHub tal como lo ve una cuenta de un
local, pero **solo en el local de muestra** (`restaurants.is_sandbox`), con
datos ficticios: no hay forma, ni por API, de mirar un restaurante real. La
vista previa se usa de verdad (tomar pedidos, cobrar, encolar sin señal).

1. `/plataforma/vista-previa` muestra el local de muestra (o que todavía no
   existe), cuándo se creó y sus cuentas, que no tienen contraseña. «Reiniciar
   local de muestra» se confirma: el vigente queda archivado (desactivado) y se
   crea uno nuevo con los datos de siempre. Si el local no tiene una cuenta
   activa del tipo pedido, el servidor responde 409 y la pantalla ofrece
   reiniciarlo ahí mismo.
2. «Ver como…» pide `POST /platform/preview {as}` (un código de un solo uso
   que vale 60 s) y abre una **pestaña nueva** en `/vista-previa#codigo=…` con
   `noopener`. El código va en el fragmento y no en la consulta: el fragmento
   no viaja al servidor que sirve la aplicación y no queda en sus registros.
   Con `noopener` el navegador no dice si bloqueó la pestaña, así que queda
   un enlace de repuesto mientras el código vale.
3. Al cargar la página, antes de crear el router (`services/tabStorage.ts`,
   importado primero en `main.tsx`), una pestaña cargada en `/vista-previa`
   saca el fragmento de la barra con `history.replaceState` y lo guarda en
   memoria: si el archivo de la pantalla de canje no llega, el código igual
   deja la barra y el historial. La ruta se reconoce como la compara React
   Router (sin distinguir mayúsculas, decodificada, con o sin barra final:
   `/Vista-Previa/` o `/vista%2Dprevia` cuentan) y queda escrita como
   `/vista-previa`. El `loader` de la ruta (`features/auth/previewEntry.ts`,
   fuera de las guardas) toma el código de memoria y lo canjea con
   `POST /auth/preview`, sin credencial (`withoutCredential`): tampoco manda
   la de una vista previa ya abierta en esa pestaña. Es el `loader` y no un
   efecto: corre una vez por carga, aunque el modo estricto repita los efectos.
   Si se llegó navegando desde una pestaña normal, carga una sola vez
   `/vista-previa` con el fragmento (`location.replace`), nunca `reload()`.
   Si el servidor lo acepta (`preview: true`), entra al armazón normal; si no,
   explica por qué (inválido, vencido o ya usado; sin conexión) y enlaza a la
   administración.
4. Mientras dura, una franja fija arriba dice «Vista previa · Restaurante de
   muestra · como Mesero», cuánto falta para que venza y ofrece «Salir de la
   vista previa» (cierra la pestaña o, si el navegador no deja, vuelve a
   `/plataforma` recargando). No hay «Cerrar sesión» ni «Cambiar contraseña»:
   el servidor rechaza cambiarla (403) y renovar el token (401), así que la
   sesión no se renueva y vence a los 30 minutos (`exp`).

**Dónde se guarda.** La pestaña elige su almacenamiento una sola vez, al
cargarse (`services/tabStorage.ts`):

| Pestaña | Sesión | Cola sin señal |
|---|---|---|
| Normal | `localStorage`, `resthub.session.v3` (sin el token) | `localStorage`, `resthub.pedidos-sin-enviar.v2` |
| Vista previa | `sessionStorage`, `resthub.vista-previa.sesion.v1` | `sessionStorage`, misma clave de la cola |

- Es de vista previa la pestaña cargada en `/vista-previa` o marcada con
  `resthub.vista-previa.pestana.v1` en su `sessionStorage` (se marca al abrir
  la sesión y se desmarca solo al salir a propósito, así una vista previa
  vencida no vuelve a leer la sesión real al recargar).
- Una pestaña de vista previa nunca lee ni escribe `resthub.session.v3`: la
  sesión real del navegador (la de plataforma, por ejemplo, desde donde se
  abrió «Ver como…») sigue intacta en las demás pestañas, y un 401 del canje
  no cierra ninguna. Sin
  `sessionStorage` la vista previa vive en memoria; nunca cae en
  `localStorage`.
- Ahí la sesión es la del personal del local de muestra, así que las pantallas
  de `/plataforma` no se abren (la guarda no encuentra sus permisos y lleva al
  inicio): un «Salir» o un 401 en esa pestaña no cierran la sesión real del
  administrador.
- Cerrar la pestaña termina la vista previa y descarta su cola. Salir o que
  venza la sesión vacía la cola entera de la pestaña (`discardPreviewQueue`),
  de cualquier cuenta del local de muestra: es solo de esa pestaña y ya no
  tiene con qué enviarse. Salir con pedidos sin enviar se confirma antes.
- Sin sesión, una pestaña de vista previa no ofrece el acceso normal: dice que
  la vista previa venció o terminó.
- **Duplicar la pestaña** copia su `sessionStorage`: la copia es otra pestaña
  de vista previa con la misma sesión y una copia de la cola. Desde ahí cada
  una sigue por su lado (lo que una encola o descarta no lo ve la otra) y las
  dos vencen a la vez, con el mismo token; salir en una no cierra la otra.
- **Un enlace abierto en una pestaña nueva** (Ctrl o clic central) no hereda
  el `sessionStorage`: es una pestaña normal, sin la vista previa, que usa la
  sesión real del navegador (o muestra el acceso).

### Panel de observabilidad

`/plataforma/observabilidad` muestra cómo anda la aplicación con lo que el
backend guarda de sí mismo (`/platform/observability/*`, con el permiso
`platform.observability.read`;
sin servicios externos). Vive en `features/platform/observability` y se
descarga aparte, como el resto del área.

- **Ventana y restaurante.** 1 h, 6 h, 24 h (por omisión) o 7 d hasta ahora, y
  un restaurante o todos (la lista son los 100 más nuevos de
  `GET /platform/restaurants`). Acá el cliente sí manda `restaurant_id`: es un
  filtro de la plataforma, que mira a todos los locales, como
  `/platform/restaurants/{id}`; la regla de no mandarlo es de la sesión de un
  restaurante.
- **Indicadores:** peticiones, tasa de error (5xx sobre el total; el API la da
  de 0 a 1), p95, p99 y tiempo medio de base; «Eventos perdidos» aparece solo
  si el proceso perdió filas, y «Muestreado» cuando la ventana pasa de
  200 000 peticiones y los percentiles salen de una muestra.
- **Gráficos:** peticiones y errores 5xx en el mismo eje, el p95 en su propio
  gráfico (milisegundos) y las respuestas por estado. Son los SVG del panel BI,
  ahora en `components/charts`; cada uno tiene su nombre accesible, su lectura
  con teclado y su vista de tabla. Los cubos (1 min, 5 min, 15 min o 2 h) se
  rotulan en hora de Lima; con cubos de horas el eje lleva también el día.
- **Rutas:** las 20 primeras por peticiones, p95 o errores. Ordenar pide al
  servidor las 20 de esa columna (no son las mismas) y, mientras llegan,
  reordena lo que se ve. Cada ruta enlaza a sus peticiones.
- **Logs:** advertencias y errores, los más nuevos primero, con filtro por
  nivel, búsqueda (hasta 120 caracteres, en el evento y sus campos) y
  `request_id`. «Cargar más» pide las anteriores con `before_id` (páginas de
  clave, de 50). «Ver detalle» trae la entrada con sus campos como JSON con
  sangría y su traceback en un bloque de ancho fijo que se desplaza; los dos
  van como texto en un `<pre>`, nunca como HTML. Desde ahí se va a las
  peticiones de ese `request_id`, y desde cada petición a sus logs.
- **Peticiones:** una por una, filtrables desde un estado (4xx y 5xx o solo
  5xx), por plantilla de ruta exacta y por `request_id`.
- **Filtros en la dirección** (`?ventana=6h&restaurante=3&peticion=…`): un
  enlace lleva al mismo panel; cambiar un filtro reemplaza la entrada del
  historial y los enlaces entre logs y peticiones la apilan y llevan el foco a
  la sección. Los textos se aplican con «Buscar», no con cada letra.
- **Actualización:** cada 30 s solo con la pestaña a la vista
  (`document.visibilityState`, `hooks/usePageVisibility.ts`); al volver a la
  pestaña se relee lo vencido. «Pausar» la detiene del todo y «Actualizar
  ahora» relee el panel entero. Las claves cuelgan de `['platform',
  'observability', …]`: cerrar la sesión las saca del caché.

## Comprobantes electrónicos

- Con el pedido pagado, el recibo del cobro y el detalle del pedido ofrecen
  «Emitir boleta o factura» (`features/orders/invoice`). Ya emitido, muestran
  el número, el estado ante SUNAT, «Descargar PDF / XML / CDR» (los sirve
  RestHub con la sesión: se piden con el cliente del API y se guardan como
  archivo, sin enlaces públicos) e «Imprimir».
- «Comprobantes» (`features/billing`, `billing.manage`): datos fiscales del
  local, si ya puede emitir y qué le falta, el usuario y la clave SOL (nunca se
  muestran: solo «cargados» y «Reemplazar»), el certificado digital (.pfx,
  .p12 o .pem de hasta 64 KB, leído en el navegador, con aviso de vencimiento),
  lo emitido y el reenvío de lo pendiente o rechazado. `/comprobantes/:id/imprimir` es la representación
  impresa en 80 mm con base imponible, IGV y total.

## Opciones de platos y compras

- En «Menú», cada plato puede tener grupos de opciones (tamaño, extras): se
  escriben una por línea con su precio adicional después de «=». Al tomar el
  pedido, un plato con opciones abre una ventana para elegirlas; cada
  combinación es una línea del borrador (`lineKeyFor`).
- Un plato «Agotado» o «Sin insumos» (su receta no alcanza con el stock) se
  ve pero no se puede pedir. La regla se apaga desde «Inventario».
- «Inventario» suma las pestañas «Compras» (órdenes de compra: crear desde
  las sugerencias, marcar enviada, recibir con el costo real) y «Proveedores».

## Cocina, mesas e impresión

- «Cocina» (`/cocina`, `orders.take`) muestra solo lo que falta preparar y lo
  que espera a salir, en tarjetas grandes para una pantalla en la cocina; quien
  tiene `orders.manage` marca «Listo».
- En el detalle de un pedido en mesa: «Cambiar de mesa» y «Unir otra mesa».
- `/imprimir/:orderId/comanda|cuenta` arma una hoja de 80 mm para impresora
  térmica (comanda sin precios; precuenta o ticket) y lanza el diálogo de
  impresión del navegador.

## Cobro y caja

- Los meseros cobran los pedidos que tomaron (`orders.charge`); el encargado,
  cualquiera. La ventana de cobro (`features/orders/charge`) muestra la cuenta
  (platos, cortesías, descuento, ya pagado y lo que falta) y cobra de a un
  pago: todo junto, en partes iguales o por platos, con propina aparte. Cada
  pago manda `expected_balance`, así un doble toque no cobra dos veces.
- Los montos de cada parte se calculan en céntimos con las mismas reglas que
  el servidor (`chargeMath.ts`); el que vale es el que responde el servidor.
- Descuento y cortesías van antes del primer pago. El mesero ve su tope
  (`GET /restaurant`); las cortesías solo le aparecen al encargado.
- «Caja» (`features/cash`, `cash.manage`) abre y cierra el turno, muestra el
  arqueo en vivo (escucha los avisos `orders` y `cash`), el historial de
  turnos y el tope de descuento del mesero. Sin caja abierta, el cobro lo
  avisa y no deja confirmar.

## Delivery, clientes y reservas

- «Para llevar / Delivery» pregunta si el cliente recoge o se le lleva. En
  delivery pide nombre, teléfono y dirección (y una referencia). Se puede
  buscar al cliente en la libreta para no dictar sus datos; si es nuevo, se
  agrega solo. El pedido muestra la dirección y el teléfono (con enlace para
  llamar), y la comanda y la precuenta los imprimen.
- «Clientes» (`/clientes`, `customers.read`): búsqueda por nombre o teléfono,
  visitas, gasto, ticket promedio, últimos pedidos y notas. Frecuente es quien
  vino tres veces o más.
- «Reservas» (`/reservas`, `reservations.read`): las del día elegido, por hora.
  La hora se escribe en el reloj del local (`zonedInstant` en `format.ts`); si
  se asigna mesa, el servidor rechaza otra reserva que se cruce.

## Sin conexión y sesión

- Si al enviar un pedido nuevo no hay señal (o el servidor no responde), el
  pedido queda en una cola del celular (`store/offlineQueue.ts`,
  `localStorage`) y un aviso en «Pedidos» dice cuántos esperan. Se envían
  solos al volver la conexión, o con «Reintentar». Cada pedido lleva un
  `client_request_id`: un reintento de algo que sí llegó no lo duplica. Solo
  se encolan pedidos nuevos; cobrar, cambiar estados o editar necesitan señal.
- Cada pedido en cola es de la cuenta y el local que lo tomaron: en un celular
  compartido, otra cuenta no los ve ni los envía con su token. Cerrar o vencer
  la sesión no los borra; salen cuando esa cuenta vuelve a entrar, y «Cerrar
  sesión» avisa antes si quedan pedidos sin enviar.
- El token dura una hora. Mientras la aplicación se usa, `useSessionRenewal`
  pide uno nuevo (`POST /auth/refresh`) cinco minutos antes de que venza; una
  pantalla sin tocar por media hora deja que la sesión se cierre sola. La
  sesión de una vista previa no se renueva y su cola vive en su pestaña (ver
  «Vista previa como encargado o mesero»).

## Tema oscuro (preparado, no activo)

`src/index.css` trae un bloque `.dark` con la paleta completa para superficies
oscuras (contraste AA verificado) y Tailwind tiene la variante `dark:` ligada a
esa clase. **Ninguna pantalla lo activa**: no hay selector ni se sigue
`prefers-color-scheme`. Solo el panel BI se revisó en oscuro; antes de
ofrecerlo en toda la aplicación hay que recorrer las demás pantallas con la
clase `dark` puesta en `<html>` y corregir lo que no se lea.

## Convenciones

- Interfaz, mensajes y comentarios en español; identificadores en inglés.
- Un comentario solo va si dice algo que el código no puede decir.
- Commits en Conventional Commits en español (`feat(pedidos): …`). El hook
  `commit-msg` lo exige y rechaza las líneas `Co-authored-by`; `pre-commit`
  corre ESLint sobre lo preparado. CI repite lint y build en cada push.
