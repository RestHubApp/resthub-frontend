# RestHub — frontend

PWA en React + Vite + shadcn para RestHub: el mesero trabaja desde el celular y
el encargado desde la laptop. Estructura, tipos del API y convenciones están en
el `README.md`; esto es lo que un agente necesita además.

## Verificación

```bash
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm build
```

Commits en Conventional Commits en español (`feat(pedidos): …`), sin líneas
`Co-authored-by`: el hook `commit-msg` lo exige.

## Code Review Rules

Escribe la revisión en español. Formato, lint, límites entre carpetas y tipos
ya los revisa el CI: no los comentes. Marca solo lo que cambia el
comportamiento o rompe una regla de esta lista.

### Permisos y roles

- Hay dos roles: encargado y mesero (que además cobra). La interfaz pregunta
  por permisos (`useCan('orders.charge')`), nunca por el rol: marca cualquier
  comparación con `role`.
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
