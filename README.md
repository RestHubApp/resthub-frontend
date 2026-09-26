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
- PWA instalable con vite-plugin-pwa; sin señal, el mesero puede tomar pedidos nuevos (ver abajo).
- ESLint estricto (typescript-eslint, sonarjs, límites de arquitectura), Husky y lint-staged.
- Vitest para las reglas puras (cuentas del cobro, opciones, compras, horas).
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
| `pnpm test` | Pruebas unitarias con Vitest (`*.test.ts` junto al código) |
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

## Formatos, zona horaria y carga

- Soles, porcentajes, cantidades de insumo (g → kg, ml → L), fechas y horas
  salen de un solo módulo, `src/services/format.ts`. Ninguna pantalla crea su
  propio `Intl.NumberFormat`.
- "Hoy" y las horas son las del restaurante (`restaurant.timezone` de
  `GET /auth/me`, con `useTimeZone()`), no las del navegador de quien mira.
- El acceso y la toma de pedidos del mesero van en el archivo inicial; las
  pantallas del encargado (tablero, historial, menú, mesas, inventario,
  personal, perfil y panel) se descargan al abrirlas (`lazy` en
  `src/router/index.tsx`).
- Con la sesión abierta, el armazón baja en ratos libres
  (`requestIdleCallback`) los archivos de las pantallas que la cuenta puede
  abrir. Al pasar el puntero, enfocar o tocar un enlace del menú, adelanta
  además la consulta principal de esa pantalla. Las rutas y la precarga salen
  de la misma lista de `import()` del router; cada consulta se define una vez
  con `queryOptions` en `src/api/` y la usan la vista y la precarga.
- Después de guardar, las pantallas ponen en el caché lo que devolvió el
  servidor y releen de fondo, sin esperar ese segundo viaje para mostrar el
  cambio. Mientras carga una lista se ve su silueta, no un «Cargando…».

## Comprobantes electrónicos

- Con el pedido pagado, el recibo del cobro y el detalle del pedido ofrecen
  «Emitir boleta o factura» (`features/orders/invoice`). Ya emitido, muestran
  el número, el estado ante SUNAT, el PDF del proveedor e «Imprimir».
- «Comprobantes» (`features/billing`, `billing.manage`): datos fiscales del
  local (el token del proveedor nunca se muestra), lo emitido y el reenvío de
  lo pendiente o rechazado. `/comprobantes/:id/imprimir` es la representación
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
  pantalla sin tocar por media hora deja que la sesión se cierre sola.

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
