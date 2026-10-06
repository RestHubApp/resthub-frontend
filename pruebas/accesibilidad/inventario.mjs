// Inventario de estados de la interfaz que se miden: cada ruta del router
// (`src/router/index.tsx`) y cada modal, Sheet, AlertDialog, pestaña o panel
// desplegable, con la cuenta (rol) que lo abre.
//
// `ruta` admite marcadores `:nombre` que se reemplazan con `reportes/datos.json`
// (lo deja `datos.mjs`). `pasos` es lo que haría una persona para llegar al
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

const DIALOGO = '[role="dialog"], [role="alertdialog"]'
const PESTANA = '[role="tabpanel"][data-state="active"]'
const IMPRESO = '#hoja-impresa, article'

/** Las 36 rutas del router, más las variantes por rol. */
export const RUTAS = [
  // Sin sesión.
  { id: 'acceso', nombre: 'Acceso', ruta: '/acceso', patron: '/acceso', cuenta: null },
  { id: 'raiz', nombre: 'Raíz (redirige al acceso sin sesión)', ruta: '/', patron: '/', cuenta: null, redireccion: true },
  { id: 'plataforma-acceso', nombre: 'Plataforma: acceso', ruta: '/plataforma/acceso', patron: '/plataforma/acceso', cuenta: null },
  { id: 'vista-previa-sin-codigo', nombre: 'Vista previa sin código válido', ruta: '/vista-previa', patron: '/vista-previa', cuenta: null },
  { id: 'privacidad', nombre: 'Política de privacidad (pública)', ruta: '/privacidad', patron: '/privacidad', cuenta: null },
  { id: 'terminos', nombre: 'Aceptar los términos antes de empezar', ruta: '/', patron: '/', cuenta: 'sin-terminos' },

  // Mesero (celular).
  { id: 'pedidos', nombre: 'Pedidos: mesas del mesero', ruta: '/pedidos', patron: '/pedidos', cuenta: 'mesero' },
  { id: 'pedidos-nuevo', nombre: 'Toma de pedido (mesa libre)', ruta: '/pedidos/nuevo?mesa=:mesaLibre', patron: '/pedidos/nuevo', cuenta: 'mesero' },
  { id: 'pedido-detalle-mesero', nombre: 'Detalle del pedido (mesero)', ruta: '/pedidos/:pedidoPorCobrar', patron: '/pedidos/:orderId', cuenta: 'mesero' },
  { id: 'pedido-agregar', nombre: 'Agregar platos a un pedido', ruta: '/pedidos/:pedidoEnCocina/agregar', patron: '/pedidos/:orderId/agregar', cuenta: 'mesero' },
  { id: 'cocina', nombre: 'Cocina', ruta: '/cocina', patron: '/cocina', cuenta: 'mesero' },
  { id: 'perfil', nombre: 'Mi perfil', ruta: '/perfil', patron: '/perfil', cuenta: 'mesero' },
  { id: 'imprimir-comanda', nombre: 'Imprimir comanda', ruta: '/imprimir/:pedidoEnCocina/comanda', patron: '/imprimir/:orderId/:kind', cuenta: 'mesero', espera: IMPRESO },
  { id: 'imprimir-cuenta', nombre: 'Imprimir precuenta', ruta: '/imprimir/:pedidoPorCobrar/cuenta', patron: '/imprimir/:orderId/:kind', cuenta: 'mesero', espera: IMPRESO },

  // Cocina (su inicio es el tablero).
  { id: 'tablero-cocina', nombre: 'Tablero (cuenta de cocina)', ruta: '/tablero', patron: '/tablero', cuenta: 'cocina' },

  // Encargado.
  { id: 'pedidos-encargado', nombre: 'Pedidos (encargado)', ruta: '/pedidos', patron: '/pedidos', cuenta: 'encargado' },
  { id: 'pedido-detalle', nombre: 'Detalle del pedido servido (encargado)', ruta: '/pedidos/:pedidoPorCobrar', patron: '/pedidos/:orderId', cuenta: 'encargado' },
  { id: 'pedido-cobrado', nombre: 'Detalle del pedido cobrado', ruta: '/pedidos/:pedidoCobrado', patron: '/pedidos/:orderId', cuenta: 'encargado' },
  { id: 'tablero', nombre: 'Tablero', ruta: '/tablero', patron: '/tablero', cuenta: 'encargado' },
  { id: 'historial', nombre: 'Historial de pedidos', ruta: '/tablero/historial', patron: '/tablero/historial', cuenta: 'encargado' },
  { id: 'comprobantes', nombre: 'Comprobantes', ruta: '/comprobantes', patron: '/comprobantes', cuenta: 'encargado' },
  { id: 'comprobante-imprimir', nombre: 'Imprimir comprobante', ruta: '/comprobantes/:comprobante/imprimir', patron: '/comprobantes/:invoiceId/imprimir', cuenta: 'encargado', espera: IMPRESO },
  { id: 'reservas', nombre: 'Reservas', ruta: '/reservas', patron: '/reservas', cuenta: 'encargado' },
  { id: 'clientes', nombre: 'Clientes', ruta: '/clientes', patron: '/clientes', cuenta: 'encargado' },
  { id: 'caja', nombre: 'Caja', ruta: '/caja', patron: '/caja', cuenta: 'encargado' },
  { id: 'menu', nombre: 'Menú', ruta: '/menu', patron: '/menu', cuenta: 'encargado' },
  { id: 'mesas', nombre: 'Mesas', ruta: '/mesas', patron: '/mesas', cuenta: 'encargado' },
  { id: 'inventario', nombre: 'Inventario', ruta: '/inventario', patron: '/inventario', cuenta: 'encargado' },
  { id: 'receta', nombre: 'Editor de receta', ruta: '/inventario/recetas/:plato', patron: '/inventario/recetas/:menuItemId', cuenta: 'encargado' },
  { id: 'personal', nombre: 'Personal', ruta: '/personal', patron: '/personal', cuenta: 'encargado' },
  { id: 'roles', nombre: 'Roles y permisos', ruta: '/roles', patron: '/roles', cuenta: 'encargado' },
  { id: 'panel', nombre: 'Indicadores (panel BI)', ruta: '/panel', patron: '/panel', cuenta: 'encargado' },
  { id: 'panel-reposicion', nombre: 'Panel: reposición', ruta: '/panel/reposicion', patron: '/panel/reposicion', cuenta: 'encargado' },
  { id: 'panel-ia', nombre: 'Panel: decisiones de la IA', ruta: '/panel/ia', patron: '/panel/ia', cuenta: 'encargado' },
  { id: 'comodin', nombre: 'Ruta inexistente (redirige al inicio)', ruta: '/no-existe', patron: '*', cuenta: 'encargado', redireccion: true },

  // Administrador del sistema.
  { id: 'plataforma', nombre: 'Plataforma: restaurantes', ruta: '/plataforma', patron: '/plataforma', cuenta: 'plataforma' },
  { id: 'plataforma-nuevo', nombre: 'Plataforma: nuevo restaurante', ruta: '/plataforma/restaurantes/nuevo', patron: '/plataforma/restaurantes/nuevo', cuenta: 'plataforma' },
  { id: 'plataforma-detalle', nombre: 'Plataforma: detalle del restaurante', ruta: '/plataforma/restaurantes/:restaurante', patron: '/plataforma/restaurantes/:restaurantId', cuenta: 'plataforma' },
  { id: 'plataforma-bitacora', nombre: 'Plataforma: bitácora', ruta: '/plataforma/bitacora', patron: '/plataforma/bitacora', cuenta: 'plataforma' },
  { id: 'plataforma-vista-previa', nombre: 'Plataforma: vista previa', ruta: '/plataforma/vista-previa', patron: '/plataforma/vista-previa', cuenta: 'plataforma' },
  { id: 'plataforma-observabilidad', nombre: 'Plataforma: observabilidad', ruta: '/plataforma/observabilidad', patron: '/plataforma/observabilidad', cuenta: 'plataforma' },
  { id: 'plataforma-comodin', nombre: 'Plataforma: ruta inexistente (redirige)', ruta: '/plataforma/no-existe', patron: '/plataforma/*', cuenta: 'plataforma', redireccion: true },

  // Vista previa: la pestaña que abre «Ver como…», con su franja.
  { id: 'vp-encargado', nombre: 'Vista previa como encargado', ruta: '/tablero', patron: '/vista-previa', cuenta: 'vp-encargado' },
  { id: 'vp-mesero', nombre: 'Vista previa como mesero', ruta: '/pedidos', patron: '/vista-previa', cuenta: 'vp-mesero' },
]

/** Modales, Sheets, AlertDialogs, pestañas y paneles desplegables. */
export const OVERLAYS = [
  // Armazón.
  { id: 'o-mas', nombre: 'Sheet «Más» del encargado', tipo: 'Sheet', ruta: '/tablero', cuenta: 'encargado', vistas: ['movil'], pasos: [{ boton: 'Más' }] },
  { id: 'o-cuenta', nombre: 'Sheet «Cuenta» del mesero', tipo: 'Sheet', ruta: '/pedidos', cuenta: 'mesero', vistas: ['movil'], pasos: [{ boton: 'Cuenta' }] },
  { id: 'o-widget', nombre: 'Menú del widget de accesibilidad (Sienna)', tipo: 'Widget', ruta: '/pedidos', cuenta: 'mesero', vistas: ['escritorio'], pasos: [{ clic: '.asw-menu-btn' }], espera: '.asw-menu' },
  { id: 'o-widget-movil', nombre: 'Menú del widget de accesibilidad desde «Cuenta»', tipo: 'Widget', ruta: '/pedidos', cuenta: 'mesero', vistas: ['movil'], pasos: [{ boton: 'Cuenta' }, { boton: 'Accesibilidad' }], espera: '.asw-menu' },
  { id: 'o-salir-pendientes', nombre: 'Confirmar salir con pedidos sin enviar', tipo: 'AlertDialog', ruta: '/pedidos', cuenta: 'mesero', cola: true, pasos: [{ boton: 'Cerrar sesión' }], vistas: ['escritorio'] },
  { id: 'o-salir-pendientes-movil', nombre: 'Confirmar salir con pedidos sin enviar (desde «Cuenta»)', tipo: 'AlertDialog', ruta: '/pedidos', cuenta: 'mesero', cola: true, pasos: [{ boton: 'Cuenta' }, { boton: 'Cerrar sesión' }], vistas: ['movil'] },
  { id: 'e-cola', nombre: 'Aviso de pedidos sin enviar (sin señal)', tipo: 'Estado', ruta: '/pedidos', cuenta: 'mesero', cola: true, pasos: [], espera: 'main h1' },
  { id: 'o-vp-salir', nombre: 'Confirmar salir de la vista previa con pedidos sin enviar', tipo: 'AlertDialog', ruta: '/pedidos', cuenta: 'vp-mesero', cola: true, pasos: [{ boton: 'Salir de la vista previa' }] },

  // Pedidos del mesero.
  { id: 'o-llevar', nombre: 'Diálogo «Pedido para llevar o delivery»', tipo: 'Dialog', ruta: '/pedidos', cuenta: 'mesero', pasos: [{ boton: 'Para llevar / Delivery' }] },
  { id: 't-llevar', nombre: 'Pestaña «Llevar y delivery»', tipo: 'Tabs', ruta: '/pedidos', cuenta: 'mesero', pasos: [{ pestana: 'Llevar y delivery' }], espera: PESTANA },
  { id: 't-mis-pedidos', nombre: 'Pestaña «Mis pedidos»', tipo: 'Tabs', ruta: '/pedidos', cuenta: 'mesero', pasos: [{ pestana: 'Mis pedidos' }], espera: PESTANA },
  { id: 'o-opciones', nombre: 'Diálogo de opciones del plato', tipo: 'Dialog', ruta: '/pedidos/nuevo?mesa=:mesaLibre', cuenta: 'mesero', pasos: [{ boton: /^Lomo saltado/ }] },
  { id: 'o-resumen', nombre: 'Sheet «Resumen» del pedido', tipo: 'Sheet', ruta: '/pedidos/nuevo?mesa=:mesaLibre', cuenta: 'mesero', pasos: [{ boton: /^Menú del día.*S\// }, { clic: 'button:has(span[aria-live])' }] },
  { id: 'o-nota', nombre: 'Diálogo de nota del plato', tipo: 'Dialog', ruta: '/pedidos/:pedidoAbierto', cuenta: 'mesero', pasos: [{ boton: /Agregar nota|Cambiar nota/ }] },

  // Detalle del pedido (encargado).
  { id: 'o-cobro', nombre: 'Diálogo de cobro', tipo: 'Dialog', ruta: '/pedidos/:pedidoPorCobrar', cuenta: 'encargado', pasos: [{ boton: 'Cobrar' }] },
  { id: 'o-cobro-cortesia', nombre: 'Cobro con «Invitar un plato» abierto', tipo: 'Dialog', ruta: '/pedidos/:pedidoPorCobrar', cuenta: 'encargado', pasos: [{ boton: 'Cobrar' }, { resumen: 'Invitar un plato (cortesía)' }] },
  { id: 'o-cobro-partes', nombre: 'Cobro en partes iguales', tipo: 'Dialog', ruta: '/pedidos/:pedidoPorCobrar', cuenta: 'encargado', pasos: [{ boton: 'Cobrar' }, { opcion: 'Partes iguales' }] },
  { id: 'o-cobro-platos', nombre: 'Cobro por platos', tipo: 'Dialog', ruta: '/pedidos/:pedidoPorCobrar', cuenta: 'encargado', pasos: [{ boton: 'Cobrar' }, { opcion: 'Por platos' }] },
  { id: 'o-cobro-descuento', nombre: 'Cobro con «Aplicar descuento» abierto', tipo: 'Dialog', ruta: '/pedidos/:pedidoPorCobrar', cuenta: 'encargado', pasos: [{ boton: 'Cobrar' }, { boton: 'Aplicar descuento' }] },
  { id: 'o-cancelar', nombre: 'Diálogo «Cancelar pedido»', tipo: 'Dialog', ruta: '/pedidos/:pedidoPorCobrar', cuenta: 'encargado', pasos: [{ boton: 'Cancelar pedido' }] },
  { id: 'o-cambiar-mesa', nombre: 'Diálogo «Cambiar de mesa»', tipo: 'Dialog', ruta: '/pedidos/:pedidoPorCobrar', cuenta: 'encargado', pasos: [{ boton: 'Cambiar de mesa' }] },
  { id: 'o-unir-mesa', nombre: 'Diálogo «Unir otra mesa»', tipo: 'Dialog', ruta: '/pedidos/:pedidoPorCobrar', cuenta: 'encargado', pasos: [{ boton: 'Unir otra mesa' }] },
  { id: 'o-comprobante', nombre: 'Diálogo «Emitir boleta o factura»', tipo: 'Dialog', ruta: '/pedidos/:pedidoSinComprobante', cuenta: 'encargado', pasos: [{ boton: 'Emitir boleta o factura' }] },
  { id: 'o-tablero-cancelar', nombre: 'Cancelar desde el tablero', tipo: 'Dialog', ruta: '/tablero', cuenta: 'encargado', pasos: [{ boton: /^Cancelar pedido #/ }] },
  { id: 'd-historial', nombre: 'Historial: detalle desplegado', tipo: 'Desplegable', ruta: '/tablero/historial', cuenta: 'encargado', pasos: [{ fecha: 'Desde', dias: -7 }, { boton: /^Ver el detalle del pedido/ }], espera: 'main' },

  // Caja y comprobantes.
  { id: 'o-turno', nombre: 'Diálogo del turno de caja', tipo: 'Dialog', ruta: '/caja', cuenta: 'encargado', pasos: [{ boton: /Cerró/ }] },
  { id: 'd-descuentos', nombre: 'Caja: «Descuentos del mesero» desplegado', tipo: 'Desplegable', ruta: '/caja', cuenta: 'encargado', pasos: [{ boton: 'Descuentos del mesero' }], espera: 'main' },
  { id: 'd-datos-fiscales', nombre: 'Comprobantes: «Datos fiscales» desplegado', tipo: 'Desplegable', ruta: '/comprobantes', cuenta: 'encargado', pasos: [{ boton: 'Datos fiscales' }], espera: 'main' },

  // Menú.
  { id: 'o-nueva-categoria', nombre: 'Diálogo «Nueva categoría»', tipo: 'Dialog', ruta: '/menu', cuenta: 'encargado', pasos: [{ boton: 'Nueva categoría' }] },
  { id: 'o-nuevo-plato', nombre: 'Diálogo «Nuevo plato»', tipo: 'Dialog', ruta: '/menu', cuenta: 'encargado', pasos: [{ boton: 'Nuevo plato' }] },
  { id: 'o-editar-categoria', nombre: 'Diálogo «Editar categoría»', tipo: 'Dialog', ruta: '/menu', cuenta: 'encargado', pasos: [{ boton: 'Editar la categoría Entradas' }] },
  { id: 'o-editar-plato', nombre: 'Diálogo «Editar plato» (con opciones)', tipo: 'Dialog', ruta: '/menu', cuenta: 'encargado', pasos: [{ boton: 'Editar Lomo saltado' }] },
  { id: 'o-desactivar-categoria', nombre: 'Confirmar desactivar categoría', tipo: 'AlertDialog', ruta: '/menu', cuenta: 'encargado', pasos: [{ boton: 'Desactivar la categoría Entradas' }] },
  { id: 'o-desactivar-plato', nombre: 'Confirmar desactivar plato', tipo: 'AlertDialog', ruta: '/menu', cuenta: 'encargado', pasos: [{ boton: 'Desactivar' }] },
  { id: 'o-eliminar-categoria', nombre: 'Confirmar eliminar categoría vacía', tipo: 'AlertDialog', ruta: '/menu', cuenta: 'encargado', pasos: [{ boton: /^Eliminar la categoría/ }] },

  // Mesas.
  { id: 'o-nueva-mesa', nombre: 'Diálogo «Nueva mesa»', tipo: 'Dialog', ruta: '/mesas', cuenta: 'encargado', pasos: [{ boton: 'Nueva mesa' }] },
  { id: 'o-renombrar-mesa', nombre: 'Diálogo «Renombrar mesa»', tipo: 'Dialog', ruta: '/mesas', cuenta: 'encargado', pasos: [{ boton: 'Renombrar' }] },

  // Inventario.
  { id: 't-movimientos', nombre: 'Inventario: pestaña Movimientos', tipo: 'Tabs', ruta: '/inventario', cuenta: 'encargado', pasos: [{ pestana: 'Movimientos' }], espera: PESTANA },
  { id: 't-alertas', nombre: 'Inventario: pestaña Alertas', tipo: 'Tabs', ruta: '/inventario', cuenta: 'encargado', pasos: [{ pestana: /^Alertas/ }], espera: PESTANA },
  { id: 't-recetas', nombre: 'Inventario: pestaña Recetas', tipo: 'Tabs', ruta: '/inventario', cuenta: 'encargado', pasos: [{ pestana: 'Recetas' }], espera: PESTANA },
  { id: 't-compras', nombre: 'Inventario: pestaña Compras', tipo: 'Tabs', ruta: '/inventario', cuenta: 'encargado', pasos: [{ pestana: 'Compras' }], espera: PESTANA },
  { id: 't-proveedores', nombre: 'Inventario: pestaña Proveedores', tipo: 'Tabs', ruta: '/inventario', cuenta: 'encargado', pasos: [{ pestana: 'Proveedores' }], espera: PESTANA },
  { id: 'o-nuevo-insumo', nombre: 'Diálogo «Nuevo insumo»', tipo: 'Dialog', ruta: '/inventario', cuenta: 'encargado', pasos: [{ boton: 'Nuevo insumo' }] },
  { id: 'o-compra', nombre: 'Diálogo «Compra» de un insumo', tipo: 'Dialog', ruta: '/inventario', cuenta: 'encargado', pasos: [{ boton: 'Compra de Aceite vegetal' }] },
  { id: 'o-merma', nombre: 'Diálogo «Merma» de un insumo', tipo: 'Dialog', ruta: '/inventario', cuenta: 'encargado', pasos: [{ boton: 'Merma de Aceite vegetal' }] },
  { id: 'o-ajuste', nombre: 'Diálogo «Ajuste» de un insumo', tipo: 'Dialog', ruta: '/inventario', cuenta: 'encargado', pasos: [{ boton: 'Ajuste de Aceite vegetal' }] },
  { id: 'o-editar-insumo', nombre: 'Diálogo «Editar insumo»', tipo: 'Dialog', ruta: '/inventario', cuenta: 'encargado', pasos: [{ boton: 'Editar Aceite vegetal' }] },
  { id: 'o-nueva-orden', nombre: 'Diálogo «Nueva orden de compra»', tipo: 'Dialog', ruta: '/inventario', cuenta: 'encargado', pasos: [{ pestana: 'Compras' }, { boton: 'Nueva orden' }] },
  { id: 'o-recibir-orden', nombre: 'Diálogo «Recibir la orden»', tipo: 'Dialog', ruta: '/inventario', cuenta: 'encargado', pasos: [{ pestana: 'Compras' }, { boton: 'Recibir' }] },
  { id: 'o-nuevo-proveedor', nombre: 'Diálogo «Nuevo proveedor»', tipo: 'Dialog', ruta: '/inventario', cuenta: 'encargado', pasos: [{ pestana: 'Proveedores' }, { boton: 'Nuevo proveedor' }] },
  { id: 'o-editar-proveedor', nombre: 'Diálogo «Editar proveedor»', tipo: 'Dialog', ruta: '/inventario', cuenta: 'encargado', pasos: [{ pestana: 'Proveedores' }, { boton: 'Editar' }] },

  // Personal y roles.
  { id: 'o-nueva-cuenta', nombre: 'Diálogo «Nueva cuenta»', tipo: 'Dialog', ruta: '/personal', cuenta: 'encargado', pasos: [{ boton: 'Nueva cuenta' }] },
  { id: 'o-editar-cuenta', nombre: 'Diálogo «Editar cuenta»', tipo: 'Dialog', ruta: '/personal', cuenta: 'encargado', pasos: [{ boton: 'Editar' }] },
  { id: 'o-clave-cuenta', nombre: 'Diálogo «Contraseña» de una cuenta', tipo: 'Dialog', ruta: '/personal', cuenta: 'encargado', pasos: [{ boton: 'Contraseña' }] },
  { id: 'o-desactivar-cuenta', nombre: 'Confirmar desactivar cuenta', tipo: 'AlertDialog', ruta: '/personal', cuenta: 'encargado', pasos: [{ boton: 'Desactivar' }] },
  { id: 'o-nuevo-rol', nombre: 'Diálogo «Nuevo rol»', tipo: 'Dialog', ruta: '/roles', cuenta: 'encargado', pasos: [{ boton: 'Nuevo rol' }] },
  { id: 'o-editar-rol', nombre: 'Diálogo «Editar el rol Mesero»', tipo: 'Dialog', ruta: '/roles', cuenta: 'encargado', pasos: [{ boton: 'Editar el rol Mesero' }] },
  { id: 'o-ver-rol', nombre: 'Diálogo «Permisos del rol Encargado»', tipo: 'Dialog', ruta: '/roles', cuenta: 'encargado', pasos: [{ boton: 'Ver permisos del rol Encargado' }] },
  { id: 'o-eliminar-rol', nombre: 'Confirmar eliminar rol', tipo: 'AlertDialog', ruta: '/roles', cuenta: 'encargado', pasos: [{ boton: /^Eliminar el rol/ }] },

  // Reservas y clientes.
  { id: 'o-nueva-reserva', nombre: 'Diálogo «Nueva reserva»', tipo: 'Dialog', ruta: '/reservas', cuenta: 'encargado', pasos: [{ boton: 'Nueva reserva' }] },
  { id: 'o-editar-reserva', nombre: 'Diálogo «Editar reserva»', tipo: 'Dialog', ruta: '/reservas', cuenta: 'encargado', pasos: [{ boton: /^Editar/ }] },
  { id: 'o-nuevo-cliente', nombre: 'Diálogo «Nuevo cliente»', tipo: 'Dialog', ruta: '/clientes', cuenta: 'encargado', pasos: [{ boton: 'Nuevo cliente' }] },
  { id: 'o-ficha-cliente', nombre: 'Sheet con la ficha del cliente', tipo: 'Sheet', ruta: '/clientes', cuenta: 'encargado', pasos: [{ boton: /Lucía Quispe/ }] },
  { id: 'o-editar-cliente', nombre: 'Diálogo «Editar cliente» desde la ficha', tipo: 'Dialog', ruta: '/clientes', cuenta: 'encargado', pasos: [{ boton: /Lucía Quispe/ }, { esperar: DIALOGO }, { boton: 'Editar datos' }], espera: '[role="dialog"] form' },
  { id: 'o-borrar-cliente', nombre: 'Confirmación «Borrar sus datos» del cliente', tipo: 'AlertDialog', ruta: '/clientes', cuenta: 'encargado', pasos: [{ boton: /Lucía Quispe/ }, { esperar: DIALOGO }, { boton: 'Borrar sus datos' }], espera: '[role="alertdialog"]' },

  // Panel BI.
  { id: 'e-panel-personalizado', nombre: 'Panel: rango personalizado', tipo: 'Estado', ruta: '/panel', cuenta: 'encargado', pasos: [{ boton: 'Personalizado' }], espera: 'main input[type="date"]' },
  { id: 'e-panel-tabla', nombre: 'Panel: gráfico como tabla', tipo: 'Estado', ruta: '/panel', cuenta: 'encargado', pasos: [{ boton: 'Ver tabla' }], espera: 'main table' },
  { id: 'e-ia-json', nombre: 'Panel IA: JSON desplegado', tipo: 'Desplegable', ruta: '/panel/ia', cuenta: 'encargado', pasos: [{ boton: 'Ver JSON' }], espera: 'main' },

  // Plataforma.
  { id: 'o-agregar-encargado', nombre: 'Diálogo «Agregar encargado»', tipo: 'Dialog', ruta: '/plataforma/restaurantes/:restaurante', cuenta: 'plataforma', pasos: [{ boton: 'Agregar encargado' }] },
  { id: 'o-desactivar-restaurante', nombre: 'Confirmar desactivar restaurante', tipo: 'AlertDialog', ruta: '/plataforma/restaurantes/:restaurante', cuenta: 'plataforma', pasos: [{ boton: 'Desactivar restaurante' }] },
  { id: 'o-reiniciar-muestra', nombre: 'Confirmar reiniciar el local de muestra', tipo: 'AlertDialog', ruta: '/plataforma/vista-previa', cuenta: 'plataforma', pasos: [{ boton: 'Reiniciar local de muestra' }] },
  { id: 'e-obs-tabla', nombre: 'Observabilidad: gráfico como tabla', tipo: 'Estado', ruta: '/plataforma/observabilidad', cuenta: 'plataforma', pasos: [{ boton: 'Ver tabla' }], espera: 'main table' },
  { id: 'e-obs-detalle', nombre: 'Observabilidad: detalle de un registro', tipo: 'Desplegable', ruta: '/plataforma/observabilidad', cuenta: 'plataforma', pasos: [{ boton: 'Cargar logs' }, { boton: 'Ver detalle' }], espera: 'main' },
]

/** Todos los estados, como una sola lista con su clase. */
export const ESTADOS = [
  ...RUTAS.map((r) => ({ ...r, clase: 'ruta', tipo: r.redireccion ? 'Redirección' : 'Ruta' })),
  ...OVERLAYS.map((o) => ({ ...o, clase: 'overlay', espera: o.espera ?? DIALOGO })),
]

/** Las rutas que declara `src/router/index.tsx`, para comprobar que ninguna quedó fuera. */
export const RUTAS_DEL_ROUTER = [
  '/', '/acceso', '/pedidos', '/pedidos/nuevo', '/pedidos/:orderId', '/pedidos/:orderId/agregar',
  '/perfil', '/tablero', '/tablero/historial', '/cocina', '/imprimir/:orderId/:kind', '/comprobantes',
  '/comprobantes/:invoiceId/imprimir', '/reservas', '/clientes', '/caja', '/menu', '/mesas', '/inventario',
  '/inventario/recetas/:menuItemId', '/personal', '/roles', '/panel', '/panel/reposicion', '/panel/ia', '*',
  '/plataforma/acceso', '/plataforma', '/plataforma/restaurantes/nuevo', '/plataforma/restaurantes/:restaurantId',
  '/plataforma/bitacora', '/plataforma/vista-previa', '/plataforma/observabilidad', '/plataforma/*', '/vista-previa', '/privacidad',
]
