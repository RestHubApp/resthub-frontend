# RestHub — frontend

PWA en React + Vite + shadcn para RestHub: el mesero trabaja desde el celular y
el encargado desde la laptop. Estructura, tipos del API y convenciones están en
el `README.md`; esto es lo que un agente necesita además.

## Verificación

```bash
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Las pruebas son de Jest (no de Vitest): importan de `@jest/globals` y las de
componentes usan React Testing Library. Los detalles están en el `README.md`.

Commits en Conventional Commits en español (`feat(pedidos): …`). El hook
`.husky/commit-msg` comprueba la forma y rechaza cualquier línea
`Co-authored-by` y las marcas de IA («Generated with…», 🤖); el español es
convención del equipo, no lo comprueba el hook. El título y la descripción de
los PR tampoco pueden llevar esas marcas (lo revisa el workflow `Atribución`).

## Reglas de calidad (CI)

Además de `typecheck`, `lint`, `test` y `build`, el CI corre `pnpm knip` y
`pnpm dup`. Lo que hay que saber al escribir código:

- **Imports** (`import-x`): sin ciclos, sin imports duplicados ni a sí mismo,
  sin `../` redundantes, sin dependencias no declaradas, sin `export let`, y
  los imports van primero. Un ciclo se rompe subiendo lo compartido; no se
  silencia.
- **Rutas de import** (`no-relative-import-paths`): dentro de `src`, lo que no
  está en la misma carpeta se importa con `@/` (`@/api/auth`, no
  `../../api/auth`). Vale también para `import()` dinámicos y `jest.mock`.
- **Accesibilidad** (`jsx-a11y` estricto): nada de `tabIndex` ni manejadores
  en elementos no interactivos. Si un control de verdad no tiene rol ARIA que
  lo describa, la excepción va en su línea con el motivo.
- **TanStack Query**: toda consulta se define con `queryOptions` en `src/api/`
  (clave y `queryFn` juntas) y la vista la usa con `useQuery(xQuery(...))`.
  No se escriben `queryKey` a mano fuera de `src/api/`.
- **TypeScript**: `switch` exhaustivo, condiciones booleanas explícitas
  (`strict-boolean-expressions`), nada usado antes de declararse, y los accesos
  por índice (`lista[0]`, `params['id']`) pueden ser `undefined`.
- **Efectos**: lo que reacciona a un evento va en el manejador, no en un
  `useEffect` (`react-you-might-not-need-an-effect`).
- **Código sin uso** (`knip`): no se exporta lo que nadie importa. `src/components/ui/`
  queda fuera porque lo gestiona el CLI de shadcn.
- **Duplicación** (`jscpd`, `.jscpd.json`): tope del 1 % (bloques de 5 líneas o
  50 tokens), sin contar pruebas, `ui/` ni `schema.d.ts`.

## Búsqueda de código

Si están instalados, usa CodeGraph y tgrep antes que grep/find o leer archivos
enteros; son más rápidos y cualquier agente o subagente puede usarlos.

- **CodeGraph** (`.codegraph/` en la raíz) para entender código: definiciones,
  quién llama a qué y el impacto de un cambio. MCP `codegraph_explore`, o por
  shell `codegraph explore "<pregunta o símbolos>"`, `codegraph callers <símbolo>`,
  `codegraph impact <símbolo>`. Sin índice: `codegraph init --yes`.
- **tgrep** para texto y regex: MCP `search_code` / `find_files` (con
  `freshness: "current"` para ver ediciones recientes), o por shell
  `tgrep -- "patrón" .`, `tgrep -F -- "literal" .`, `tgrep -l -- "patrón" .`.

Si no están disponibles o no pueden expresar la consulta, usa grep/rg. No
subas `.codegraph/` ni índices de tgrep al repositorio.

## Code Review Rules

Escribe la revisión en español. Formato, lint, límites entre carpetas y tipos
ya los revisa el CI: no los comentes. Marca solo lo que cambia el
comportamiento o rompe una regla de esta lista.

### Aislamiento entre restaurantes y sesión

El aislamiento lo garantiza el backend; el frontend no debe abrirle huecos.

- El cliente nunca envía `restaurant_id` (ni en el cuerpo, la URL o un
  parámetro): el servidor lo toma del token. Marca cualquier petición que lo
  mande.
- Al cerrar o vencer la sesión se vacía el caché de consultas
  (`clearQueriesExcept`, que solo deja las de la sesión de plataforma) y lo
  guardado de la cuenta; nada de una cuenta queda visible para la siguiente en
  el mismo celular.
- La sesión del administrador del sistema es otra sesión: su token viaja solo
  a `/platform/*` y el de restaurante nunca va ahí. Marca cualquier petición
  que mezcle credenciales o una pantalla de `/plataforma` que lea la sesión
  del restaurante.
- Un 404 se muestra como «no existe» sin sugerir que el recurso es de otro
  local.

### Permisos y roles

- Cada restaurante tiene el encargado, el mesero (que además cobra) y los
  roles que arme en «Roles». La interfaz pregunta por permisos
  (`useCan('orders.charge')`), nunca por el rol: marca cualquier comparación
  con el rol, su nombre o su clase para decidir qué se muestra.
- Ocultar un botón es comodidad, no seguridad; el servidor vuelve a
  comprobar. Aun así, la pantalla no debe ofrecer lo que el servidor va a
  rechazar: el mesero ve «Cobrar» solo en los pedidos que tomó.

### Contrato con el backend

- `src/api/schema.d.ts` es generado: no se edita a mano. Un cambio de contrato
  se hace regenerándolo (`pnpm generate:api`) en el mismo PR.
- Las pantallas no llaman a Axios ni a `fetch`: pasan por
  `src/services/api.ts` y las funciones de `src/api/`. Cada consulta se define
  una vez con `queryOptions` y la usan la vista y la precarga.
- Después de guardar se muestra lo que devolvió el servidor, no lo que se
  envió.
- Si el servidor rechaza un cambio porque el pedido cambió mientras tanto
  (409), se avisa y se relee; no se reintenta a ciegas ni se muestra el dato
  viejo como si se hubiera guardado.
- La IA nunca bloquea una pantalla: las marcas de las notas (alergias) y las
  sugerencias llegan en consultas aparte. Tomar, servir o cobrar un pedido no
  espera a la IA ni falla si esa consulta falla.

### Dinero, fechas y textos

- La aritmética de soles se hace en centavos enteros; marca sumas, restas o
  comparaciones de montos con decimales de JavaScript. Al API los montos viajan
  como texto decimal (`"28.00"`).
- Soles, cantidades, fechas y horas se formatean solo con
  `src/services/format.ts`; marca cualquier `Intl.NumberFormat` o
  `toLocaleString` suelto.
- "Hoy" y las horas son las del restaurante (`useTimeZone()`), no las del
  navegador.
- Interfaz y mensajes en español, con el mismo nombre de estado que usan la
  insignia y el tablero.

### Uso en el celular

- El flujo del mesero tiene que funcionar con una mano en un celular: botones
  grandes, sin hover como única forma de llegar a algo, y sin desplazamiento
  horizontal.
- Una acción que cambia dinero o estado (cobrar, cancelar, cerrar caja) se
  confirma y no se puede disparar dos veces con un doble toque.
- Sin conexión, nada se pierde en silencio: el usuario ve el estado y lo que
  quedó pendiente.

### Accesibilidad

- Todo control tiene nombre accesible, el foco se ve y el contraste cumple AA.
