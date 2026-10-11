// Inventario de estados de la interfaz que se miden: cada ruta del router
// (`src/router/index.tsx`) y cada modal, Sheet, AlertDialog, pestaña o panel
// desplegable, con la cuenta (rol) que lo abre.
//
// `ruta` admite marcadores `:nombre` que se reemplazan con `reports/datos.json`
// (lo deja `data.mjs`). `pasos` es lo que haría una persona para llegar al
// estado; cada paso es uno de:
//   { boton: 'Nombre' | /regex/ }   clic en el botón con ese nombre accesible
//   { pestana: 'Nombre' }           clic en la pestaña (role=tab)
//   { enlace: 'Nombre' }            clic en el enlace
//   { opcion: 'Nombre' }            marca la opción (role=radio)
//   { fecha: 'Etiqueta', dias: -7 } pone en ese campo la fecha de hace 7 días
//   { resumen: 'Texto' }            abre un <details> por su <summary>
//   { clic: 'selector css' }        clic en el primer elemento visible
//   { sinConexion: true }           corta la red del contexto
//   { esperar: 'selector css' }     espera a que aparezca
// `cola: true` deja un pedido en la cola sin señal del celular y hace fallar
// por red el `POST /orders` que intenta enviarlo: así se ve lo que la persona
// ve sin señal (el aviso y la confirmación al salir) sin crear pedidos.
// `vistas` limita el estado a escritorio o móvil (por defecto, los dos).
// `patron` es la ruta del router que cubre el estado; con él se arma la matriz.

const DIALOG = '[role="dialog"], [role="alertdialog"]'
const TAB = '[role="tabpanel"][data-state="active"]'
const PRINTED = '#hoja-impresa, article'

/** Las 36 rutas del router, más las variantes por rol. */
export const ROUTES = [
  // Sin sesión.
  { id: 'acceso', name: 'Acceso', route: '/acceso', pattern: '/acceso', account: null },
  { id: 'raiz', name: 'Raíz (redirige al acceso sin sesión)', route: '/', pattern: '/', account: null, redirect: true },
  { id: 'plataforma-acceso', name: 'Plataforma: acceso de antes (redirige al acceso)', route: '/plataforma/acceso', pattern: '/plataforma/acceso', account: null, redirect: true },
  { id: 'vista-previa-sin-codigo', name: 'Vista previa sin código válido', route: '/vista-previa', pattern: '/vista-previa', account: null },
  { id: 'privacidad', name: 'Política de privacidad (pública)', route: '/privacidad', pattern: '/privacidad', account: null },
  { id: 'terminos', name: 'Aceptar los términos antes de empezar', route: '/', pattern: '/', account: 'sin-terminos' },

  // Mesero (celular).
  { id: 'pedidos', name: 'Pedidos: mesas del mesero', route: '/pedidos', pattern: '/pedidos', account: 'waiter' },
  { id: 'pedidos-nuevo', name: 'Toma de pedido (mesa libre)', route: '/pedidos/nuevo?mesa=:freeTable', pattern: '/pedidos/nuevo', account: 'waiter' },
  { id: 'pedido-detalle-mesero', name: 'Detalle del pedido (mesero)', route: '/pedidos/:orderToCharge', pattern: '/pedidos/:orderId', account: 'waiter' },
  { id: 'pedido-agregar', name: 'Agregar platos a un pedido', route: '/pedidos/:orderInKitchen/agregar', pattern: '/pedidos/:orderId/agregar', account: 'waiter' },
  { id: 'kitchen', name: 'Cocina', route: '/cocina', pattern: '/cocina', account: 'waiter' },
  { id: 'perfil', name: 'Mi perfil', route: '/perfil', pattern: '/perfil', account: 'waiter' },
  { id: 'imprimir-comanda', name: 'Imprimir comanda', route: '/imprimir/:orderInKitchen/comanda', pattern: '/imprimir/:orderId/:kind', account: 'waiter', wait: PRINTED },
  { id: 'imprimir-cuenta', name: 'Imprimir precuenta', route: '/imprimir/:orderToCharge/cuenta', pattern: '/imprimir/:orderId/:kind', account: 'waiter', wait: PRINTED },

  // Cocina (su inicio es el tablero).
  { id: 'tablero-cocina', name: 'Tablero (cuenta de cocina)', route: '/tablero', pattern: '/tablero', account: 'kitchen' },

  // Encargado.
  { id: 'pedidos-encargado', name: 'Pedidos (encargado)', route: '/pedidos', pattern: '/pedidos', account: 'owner' },
  { id: 'pedido-detalle', name: 'Detalle del pedido servido (encargado)', route: '/pedidos/:orderToCharge', pattern: '/pedidos/:orderId', account: 'owner' },
  { id: 'pedido-cobrado', name: 'Detalle del pedido cobrado', route: '/pedidos/:orderCharged', pattern: '/pedidos/:orderId', account: 'owner' },
  { id: 'tablero', name: 'Tablero', route: '/tablero', pattern: '/tablero', account: 'owner' },
  { id: 'historial', name: 'Historial de pedidos', route: '/tablero/historial', pattern: '/tablero/historial', account: 'owner' },
  { id: 'comprobantes', name: 'Comprobantes', route: '/comprobantes', pattern: '/comprobantes', account: 'owner' },
  { id: 'comprobante-imprimir', name: 'Imprimir comprobante', route: '/comprobantes/:invoice/imprimir', pattern: '/comprobantes/:invoiceId/imprimir', account: 'owner', wait: PRINTED },
  { id: 'reservas', name: 'Reservas', route: '/reservas', pattern: '/reservas', account: 'owner' },
  { id: 'clientes', name: 'Clientes', route: '/clientes', pattern: '/clientes', account: 'owner' },
  { id: 'caja', name: 'Caja', route: '/caja', pattern: '/caja', account: 'owner' },
  { id: 'menu', name: 'Menú', route: '/menu', pattern: '/menu', account: 'owner' },
  { id: 'mesas', name: 'Mesas', route: '/mesas', pattern: '/mesas', account: 'owner' },
  { id: 'inventario', name: 'Inventario', route: '/inventario', pattern: '/inventario', account: 'owner' },
  { id: 'receta', name: 'Editor de receta', route: '/inventario/recetas/:dish', pattern: '/inventario/recetas/:menuItemId', account: 'owner' },
  { id: 'personal', name: 'Personal', route: '/personal', pattern: '/personal', account: 'owner' },
  { id: 'roles', name: 'Roles y permisos', route: '/roles', pattern: '/roles', account: 'owner' },
  { id: 'panel', name: 'Indicadores (panel BI)', route: '/panel', pattern: '/panel', account: 'owner' },
  { id: 'panel-reposicion', name: 'Panel: reposición', route: '/panel/reposicion', pattern: '/panel/reposicion', account: 'owner' },
  { id: 'panel-ia', name: 'Panel: decisiones de la IA', route: '/panel/ia', pattern: '/panel/ia', account: 'owner' },
  { id: 'comodin', name: 'Ruta inexistente (redirige al inicio)', route: '/no-existe', pattern: '*', account: 'owner', redirect: true },

  // Administrador del sistema.
  { id: 'platform', name: 'Plataforma: restaurantes', route: '/plataforma', pattern: '/plataforma', account: 'platform' },
  { id: 'plataforma-nuevo', name: 'Plataforma: nuevo restaurante', route: '/plataforma/restaurantes/nuevo', pattern: '/plataforma/restaurantes/nuevo', account: 'platform' },
  { id: 'plataforma-detalle', name: 'Plataforma: detalle del restaurante', route: '/plataforma/restaurantes/:restaurant', pattern: '/plataforma/restaurantes/:restaurantId', account: 'platform' },
  { id: 'plataforma-bitacora', name: 'Plataforma: bitácora', route: '/plataforma/bitacora', pattern: '/plataforma/bitacora', account: 'platform' },
  { id: 'plataforma-vista-previa', name: 'Plataforma: vista previa', route: '/plataforma/vista-previa', pattern: '/plataforma/vista-previa', account: 'platform' },
  { id: 'plataforma-observabilidad', name: 'Plataforma: observabilidad', route: '/plataforma/observabilidad', pattern: '/plataforma/observabilidad', account: 'platform' },

  // Vista previa: la pestaña que abre «Ver como…», con su franja.
  { id: 'vp-encargado', name: 'Vista previa como encargado', route: '/tablero', pattern: '/vista-previa', account: 'vp-encargado' },
  { id: 'vp-mesero', name: 'Vista previa como mesero', route: '/pedidos', pattern: '/vista-previa', account: 'vp-mesero' },
]

/** Modales, Sheets, AlertDialogs, pestañas y paneles desplegables. */
export const OVERLAYS = [
  // Armazón.
  { id: 'o-mas', name: 'Sheet «Más» del encargado', type: 'Sheet', route: '/tablero', account: 'owner', views: ['mobile'], steps: [{ button: 'Más' }] },
  { id: 'o-cuenta', name: 'Sheet «Cuenta» del mesero', type: 'Sheet', route: '/pedidos', account: 'waiter', views: ['mobile'], steps: [{ button: 'Cuenta' }] },
  { id: 'o-widget', name: 'Menú del widget de accesibilidad (Sienna)', type: 'Widget', route: '/pedidos', account: 'waiter', views: ['desktop'], steps: [{ click: '[data-a11y-launcher]' }], wait: '.asw-menu' },
  { id: 'o-widget-movil', name: 'Menú del widget de accesibilidad desde «Cuenta»', type: 'Widget', route: '/pedidos', account: 'waiter', views: ['mobile'], steps: [{ button: 'Cuenta' }, { button: 'Accesibilidad' }], wait: '.asw-menu' },
  { id: 'o-salir-pendientes', name: 'Confirmar salir con pedidos sin enviar', type: 'AlertDialog', route: '/pedidos', account: 'waiter', queue: true, steps: [{ button: 'Cerrar sesión' }], views: ['desktop'] },
  { id: 'o-salir-pendientes-movil', name: 'Confirmar salir con pedidos sin enviar (desde «Cuenta»)', type: 'AlertDialog', route: '/pedidos', account: 'waiter', queue: true, steps: [{ button: 'Cuenta' }, { button: 'Cerrar sesión' }], views: ['mobile'] },
  { id: 'e-cola', name: 'Aviso de pedidos sin enviar (sin señal)', type: 'Estado', route: '/pedidos', account: 'waiter', queue: true, steps: [], wait: 'main h1' },
  { id: 'o-vp-salir', name: 'Confirmar salir de la vista previa con pedidos sin enviar', type: 'AlertDialog', route: '/pedidos', account: 'vp-mesero', queue: true, steps: [{ button: 'Salir de la vista previa' }] },

  // Pedidos del mesero.
  { id: 'o-llevar', name: 'Diálogo «Pedido para llevar o delivery»', type: 'Dialog', route: '/pedidos', account: 'waiter', steps: [{ button: 'Para llevar / Delivery' }] },
  { id: 't-llevar', name: 'Pestaña «Llevar y delivery»', type: 'Tabs', route: '/pedidos', account: 'waiter', steps: [{ tab: 'Llevar y delivery' }], wait: TAB },
  { id: 't-mis-pedidos', name: 'Pestaña «Mis pedidos»', type: 'Tabs', route: '/pedidos', account: 'waiter', steps: [{ tab: 'Mis pedidos' }], wait: TAB },
  { id: 'o-opciones', name: 'Diálogo de opciones del plato', type: 'Dialog', route: '/pedidos/nuevo?mesa=:freeTable', account: 'waiter', steps: [{ button: /^Lomo saltado/ }] },
  { id: 'o-resumen', name: 'Sheet «Resumen» del pedido', type: 'Sheet', route: '/pedidos/nuevo?mesa=:freeTable', account: 'waiter', steps: [{ button: /^Menú del día.*S\// }, { click: 'button:has(span[aria-live])' }] },
  { id: 'o-nota', name: 'Diálogo de nota del plato', type: 'Dialog', route: '/pedidos/:openOrder', account: 'waiter', steps: [{ button: /Agregar nota|Cambiar nota/ }] },

  // Detalle del pedido (encargado).
  { id: 'o-cobro', name: 'Diálogo de cobro', type: 'Dialog', route: '/pedidos/:orderToCharge', account: 'owner', steps: [{ button: 'Cobrar' }] },
  { id: 'o-cobro-cortesia', name: 'Cobro con «Invitar un plato» abierto', type: 'Dialog', route: '/pedidos/:orderToCharge', account: 'owner', steps: [{ button: 'Cobrar' }, { summary: 'Invitar un plato (cortesía)' }] },
  { id: 'o-cobro-partes', name: 'Cobro en partes iguales', type: 'Dialog', route: '/pedidos/:orderToCharge', account: 'owner', steps: [{ button: 'Cobrar' }, { option: 'Partes iguales' }] },
  { id: 'o-cobro-platos', name: 'Cobro por platos', type: 'Dialog', route: '/pedidos/:orderToCharge', account: 'owner', steps: [{ button: 'Cobrar' }, { option: 'Por platos' }] },
  { id: 'o-cobro-descuento', name: 'Cobro con «Aplicar descuento» abierto', type: 'Dialog', route: '/pedidos/:orderToCharge', account: 'owner', steps: [{ button: 'Cobrar' }, { button: 'Aplicar descuento' }] },
  { id: 'o-cancelar', name: 'Diálogo «Cancelar pedido»', type: 'Dialog', route: '/pedidos/:orderToCharge', account: 'owner', steps: [{ button: 'Cancelar pedido' }] },
  { id: 'o-cambiar-mesa', name: 'Diálogo «Cambiar de mesa»', type: 'Dialog', route: '/pedidos/:orderToCharge', account: 'owner', steps: [{ button: 'Cambiar de mesa' }] },
  { id: 'o-unir-mesa', name: 'Diálogo «Unir otra mesa»', type: 'Dialog', route: '/pedidos/:orderToCharge', account: 'owner', steps: [{ button: 'Unir otra mesa' }] },
  { id: 'o-comprobante', name: 'Diálogo «Emitir boleta o factura»', type: 'Dialog', route: '/pedidos/:orderWithoutInvoice', account: 'owner', steps: [{ button: 'Emitir boleta o factura' }] },
  { id: 'o-tablero-cancelar', name: 'Cancelar desde el tablero', type: 'Dialog', route: '/tablero', account: 'owner', steps: [{ button: /^Cancelar pedido #/ }] },
  { id: 'd-historial', name: 'Historial: detalle desplegado', type: 'Desplegable', route: '/tablero/historial', account: 'owner', steps: [{ date: 'Desde', days: -7 }, { button: /^Ver el detalle del pedido/ }], wait: 'main' },

  // Caja y comprobantes.
  { id: 'o-turno', name: 'Diálogo del turno de caja', type: 'Dialog', route: '/caja', account: 'owner', steps: [{ button: /Cerró/ }] },
  { id: 'd-descuentos', name: 'Caja: «Descuentos del mesero» desplegado', type: 'Desplegable', route: '/caja', account: 'owner', steps: [{ button: 'Descuentos del mesero' }], wait: 'main' },
  { id: 'd-datos-fiscales', name: 'Comprobantes: «Datos fiscales» desplegado', type: 'Desplegable', route: '/comprobantes', account: 'owner', steps: [{ button: 'Datos fiscales' }], wait: 'main' },

  // Menú.
  { id: 'o-nueva-categoria', name: 'Diálogo «Nueva categoría»', type: 'Dialog', route: '/menu', account: 'owner', steps: [{ button: 'Nueva categoría' }] },
  { id: 'o-nuevo-plato', name: 'Diálogo «Nuevo plato»', type: 'Dialog', route: '/menu', account: 'owner', steps: [{ button: 'Nuevo plato' }] },
  { id: 'o-editar-categoria', name: 'Diálogo «Editar categoría»', type: 'Dialog', route: '/menu', account: 'owner', steps: [{ button: 'Editar la categoría Entradas' }] },
  { id: 'o-editar-plato', name: 'Diálogo «Editar plato» (con opciones)', type: 'Dialog', route: '/menu', account: 'owner', steps: [{ button: 'Editar Lomo saltado' }] },
  { id: 'o-desactivar-categoria', name: 'Confirmar desactivar categoría', type: 'AlertDialog', route: '/menu', account: 'owner', steps: [{ button: 'Desactivar la categoría Entradas' }] },
  { id: 'o-desactivar-plato', name: 'Confirmar desactivar plato', type: 'AlertDialog', route: '/menu', account: 'owner', steps: [{ button: 'Desactivar' }] },
  { id: 'o-eliminar-categoria', name: 'Confirmar eliminar categoría vacía', type: 'AlertDialog', route: '/menu', account: 'owner', steps: [{ button: /^Eliminar la categoría/ }] },

  // Mesas.
  { id: 'o-nueva-mesa', name: 'Diálogo «Nueva mesa»', type: 'Dialog', route: '/mesas', account: 'owner', steps: [{ button: 'Nueva mesa' }] },
  { id: 'o-renombrar-mesa', name: 'Diálogo «Renombrar mesa»', type: 'Dialog', route: '/mesas', account: 'owner', steps: [{ button: 'Renombrar' }] },

  // Inventario.
  { id: 't-movimientos', name: 'Inventario: pestaña Movimientos', type: 'Tabs', route: '/inventario', account: 'owner', steps: [{ tab: 'Movimientos' }], wait: TAB },
  { id: 't-alertas', name: 'Inventario: pestaña Alertas', type: 'Tabs', route: '/inventario', account: 'owner', steps: [{ tab: /^Alertas/ }], wait: TAB },
  { id: 't-recetas', name: 'Inventario: pestaña Recetas', type: 'Tabs', route: '/inventario', account: 'owner', steps: [{ tab: 'Recetas' }], wait: TAB },
  { id: 't-compras', name: 'Inventario: pestaña Compras', type: 'Tabs', route: '/inventario', account: 'owner', steps: [{ tab: 'Compras' }], wait: TAB },
  { id: 't-proveedores', name: 'Inventario: pestaña Proveedores', type: 'Tabs', route: '/inventario', account: 'owner', steps: [{ tab: 'Proveedores' }], wait: TAB },
  { id: 'o-nuevo-insumo', name: 'Diálogo «Nuevo insumo»', type: 'Dialog', route: '/inventario', account: 'owner', steps: [{ button: 'Nuevo insumo' }] },
  { id: 'o-compra', name: 'Diálogo «Compra» de un insumo', type: 'Dialog', route: '/inventario', account: 'owner', steps: [{ button: 'Compra de Aceite vegetal' }] },
  { id: 'o-merma', name: 'Diálogo «Merma» de un insumo', type: 'Dialog', route: '/inventario', account: 'owner', steps: [{ button: 'Merma de Aceite vegetal' }] },
  { id: 'o-ajuste', name: 'Diálogo «Ajuste» de un insumo', type: 'Dialog', route: '/inventario', account: 'owner', steps: [{ button: 'Ajuste de Aceite vegetal' }] },
  { id: 'o-editar-insumo', name: 'Diálogo «Editar insumo»', type: 'Dialog', route: '/inventario', account: 'owner', steps: [{ button: 'Editar Aceite vegetal' }] },
  { id: 'o-nueva-orden', name: 'Diálogo «Nueva orden de compra»', type: 'Dialog', route: '/inventario', account: 'owner', steps: [{ tab: 'Compras' }, { button: 'Nueva orden' }] },
  { id: 'o-recibir-orden', name: 'Diálogo «Recibir la orden»', type: 'Dialog', route: '/inventario', account: 'owner', steps: [{ tab: 'Compras' }, { button: 'Recibir' }] },
  { id: 'o-nuevo-proveedor', name: 'Diálogo «Nuevo proveedor»', type: 'Dialog', route: '/inventario', account: 'owner', steps: [{ tab: 'Proveedores' }, { button: 'Nuevo proveedor' }] },
  { id: 'o-editar-proveedor', name: 'Diálogo «Editar proveedor»', type: 'Dialog', route: '/inventario', account: 'owner', steps: [{ tab: 'Proveedores' }, { button: 'Editar' }] },

  // Personal y roles.
  { id: 'o-nueva-cuenta', name: 'Diálogo «Nueva cuenta»', type: 'Dialog', route: '/personal', account: 'owner', steps: [{ button: 'Nueva cuenta' }] },
  { id: 'o-editar-cuenta', name: 'Diálogo «Editar cuenta»', type: 'Dialog', route: '/personal', account: 'owner', steps: [{ button: 'Editar' }] },
  { id: 'o-clave-cuenta', name: 'Diálogo «Contraseña» de una cuenta', type: 'Dialog', route: '/personal', account: 'owner', steps: [{ button: 'Contraseña' }] },
  { id: 'o-desactivar-cuenta', name: 'Confirmar desactivar cuenta', type: 'AlertDialog', route: '/personal', account: 'owner', steps: [{ button: 'Desactivar' }] },
  { id: 'o-nuevo-rol', name: 'Diálogo «Nuevo rol»', type: 'Dialog', route: '/roles', account: 'owner', steps: [{ button: 'Nuevo rol' }] },
  { id: 'o-editar-rol', name: 'Diálogo «Editar el rol Mesero»', type: 'Dialog', route: '/roles', account: 'owner', steps: [{ button: 'Editar el rol Mesero' }] },
  { id: 'o-ver-rol', name: 'Diálogo «Permisos del rol Encargado»', type: 'Dialog', route: '/roles', account: 'owner', steps: [{ button: 'Ver permisos del rol Encargado' }] },
  { id: 'o-eliminar-rol', name: 'Confirmar eliminar rol', type: 'AlertDialog', route: '/roles', account: 'owner', steps: [{ button: /^Eliminar el rol/ }] },

  // Reservas y clientes.
  { id: 'o-nueva-reserva', name: 'Diálogo «Nueva reserva»', type: 'Dialog', route: '/reservas', account: 'owner', steps: [{ button: 'Nueva reserva' }] },
  { id: 'o-editar-reserva', name: 'Diálogo «Editar reserva»', type: 'Dialog', route: '/reservas', account: 'owner', steps: [{ button: /^Editar/ }] },
  { id: 'o-nuevo-cliente', name: 'Diálogo «Nuevo cliente»', type: 'Dialog', route: '/clientes', account: 'owner', steps: [{ button: 'Nuevo cliente' }] },
  { id: 'o-ficha-cliente', name: 'Sheet con la ficha del cliente', type: 'Sheet', route: '/clientes', account: 'owner', steps: [{ button: /Lucía Quispe/ }] },
  { id: 'o-editar-cliente', name: 'Diálogo «Editar cliente» desde la ficha', type: 'Dialog', route: '/clientes', account: 'owner', steps: [{ button: /Lucía Quispe/ }, { wait: DIALOG }, { button: 'Editar datos' }], wait: '[role="dialog"] form' },
  { id: 'o-borrar-cliente', name: 'Confirmación «Borrar sus datos» del cliente', type: 'AlertDialog', route: '/clientes', account: 'owner', steps: [{ button: /Lucía Quispe/ }, { wait: DIALOG }, { button: 'Borrar sus datos' }], wait: '[role="alertdialog"]' },

  // Panel BI.
  { id: 'e-panel-personalizado', name: 'Panel: rango personalizado', type: 'Estado', route: '/panel', account: 'owner', steps: [{ button: 'Personalizado' }], wait: 'main input[type="date"]' },
  { id: 'e-panel-tabla', name: 'Panel: gráfico como tabla', type: 'Estado', route: '/panel', account: 'owner', steps: [{ button: 'Ver tabla' }], wait: 'main table' },
  { id: 'e-ia-json', name: 'Panel IA: JSON desplegado', type: 'Desplegable', route: '/panel/ia', account: 'owner', steps: [{ button: 'Ver JSON' }], wait: 'main' },

  // Plataforma.
  { id: 'o-agregar-encargado', name: 'Diálogo «Agregar encargado»', type: 'Dialog', route: '/plataforma/restaurantes/:restaurant', account: 'platform', steps: [{ button: 'Agregar encargado' }] },
  { id: 'o-desactivar-restaurante', name: 'Confirmar desactivar restaurante', type: 'AlertDialog', route: '/plataforma/restaurantes/:restaurant', account: 'platform', steps: [{ button: 'Desactivar restaurante' }] },
  { id: 'o-reiniciar-muestra', name: 'Confirmar reiniciar el local de muestra', type: 'AlertDialog', route: '/plataforma/vista-previa', account: 'platform', steps: [{ button: 'Reiniciar local de muestra' }] },
  { id: 'e-obs-tabla', name: 'Observabilidad: gráfico como tabla', type: 'Estado', route: '/plataforma/observabilidad', account: 'platform', steps: [{ button: 'Ver tabla' }], wait: 'main table' },
  { id: 'e-obs-detalle', name: 'Observabilidad: detalle de un registro', type: 'Desplegable', route: '/plataforma/observabilidad', account: 'platform', steps: [{ button: 'Cargar logs', optional: true }, { button: 'Ver detalle' }], wait: 'main' },
]

/** Todos los estados, como una sola lista con su clase. */
export const STATUSES = [
  ...ROUTES.map((r) => ({ ...r, class: 'ruta', type: r.redirect ? 'Redirección' : 'Ruta' })),
  ...OVERLAYS.map((o) => ({ ...o, class: 'overlay', wait: o.wait ?? DIALOG })),
]

/** Las rutas que declara `src/router/index.tsx`, para comprobar que ninguna quedó fuera. */
export const ROUTER_ROUTES = [
  '/', '/acceso', '/pedidos', '/pedidos/nuevo', '/pedidos/:orderId', '/pedidos/:orderId/agregar',
  '/perfil', '/tablero', '/tablero/historial', '/cocina', '/imprimir/:orderId/:kind', '/comprobantes',
  '/comprobantes/:invoiceId/imprimir', '/reservas', '/clientes', '/caja', '/menu', '/mesas', '/inventario',
  '/inventario/recetas/:menuItemId', '/personal', '/roles', '/panel', '/panel/reposicion', '/panel/ia', '*',
  '/plataforma/acceso', '/plataforma', '/plataforma/restaurantes/nuevo', '/plataforma/restaurantes/:restaurantId',
  '/plataforma/bitacora', '/plataforma/vista-previa', '/plataforma/observabilidad', '/vista-previa', '/privacidad',
]
