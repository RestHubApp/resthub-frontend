# Resumen de accesibilidad — RestHub

Generado por `pnpm a11y` (pruebas/accesibilidad/resumen.mjs) el 27/9/2026, 8:17:58 a. m..
Build de producción (`vite preview`) y backend local con `seed_dev` + `seed_history`.

## Cobertura

| Herramienta | Estados medidos | Porcentaje |
|---|---|---|
| axe-core 4.13.0 (rutas y overlays × escritorio/móvil) | 222 / 222 | 100.0 % |
| WAVE 3.3.1.0 (rutas y overlays × escritorio/móvil) | 222 / 222 | 100.0 % |
| Lighthouse 13.5.0 (rutas × preset escritorio/móvil; no mide modales) | 84 / 84 | 100.0 % |

Rutas del router cubiertas: axe 35/35, WAVE 35/35, Lighthouse 35/35.

## Metas

Incumplimientos (51):

- Lighthouse acceso movil: performance 67 (< 80)
- Lighthouse raiz movil: performance 67 (< 80)
- Lighthouse vista-previa-sin-codigo movil: performance 66 (< 80)
- Lighthouse pedidos escritorio: performance 89 (< 90)
- Lighthouse pedidos movil: performance 65 (< 80)
- Lighthouse pedidos-nuevo movil: performance 60 (< 80)
- Lighthouse pedido-detalle-mesero movil: performance 50 (< 80)
- Lighthouse pedido-agregar movil: performance 57 (< 80)
- Lighthouse cocina escritorio: performance 89 (< 90)
- Lighthouse cocina movil: performance 46 (< 80)
- Lighthouse perfil movil: performance 66 (< 80)
- Lighthouse imprimir-comanda movil: performance 57 (< 80)
- Lighthouse imprimir-cuenta movil: performance 55 (< 80)
- Lighthouse tablero-cocina escritorio: performance 63 (< 90)
- Lighthouse tablero-cocina movil: performance 50 (< 80)
- Lighthouse pedidos-encargado escritorio: performance 67 (< 90)
- Lighthouse pedidos-encargado movil: performance 47 (< 80)
- Lighthouse pedido-detalle escritorio: performance 81 (< 90)
- Lighthouse pedido-detalle movil: performance 60 (< 80)
- Lighthouse pedido-cobrado movil: performance 44 (< 80)
- Lighthouse tablero escritorio: performance 56 (< 90)
- Lighthouse tablero movil: performance 41 (< 80)
- Lighthouse historial escritorio: performance 58 (< 90)
- Lighthouse historial movil: performance 58 (< 80)
- Lighthouse comprobantes movil: performance 52 (< 80)
- Lighthouse comprobante-imprimir movil: performance 44 (< 80)
- Lighthouse reservas escritorio: performance 78 (< 90)
- Lighthouse reservas movil: performance 39 (< 80)
- Lighthouse clientes movil: performance 46 (< 80)
- Lighthouse caja movil: performance 63 (< 80)
- Lighthouse menu movil: performance 48 (< 80)
- Lighthouse mesas movil: performance 45 (< 80)
- Lighthouse inventario movil: performance 48 (< 80)
- Lighthouse receta movil: performance 43 (< 80)
- Lighthouse personal escritorio: performance 86 (< 90)
- Lighthouse personal movil: performance 38 (< 80)
- Lighthouse roles escritorio: performance 38 (< 90)
- Lighthouse roles movil: performance 65 (< 80)
- Lighthouse panel movil: performance 51 (< 80)
- Lighthouse panel-reposicion movil: performance 58 (< 80)
- Lighthouse panel-ia movil: performance 73 (< 80)
- Lighthouse comodin movil: performance 44 (< 80)
- Lighthouse plataforma movil: performance 62 (< 80)
- Lighthouse plataforma-nuevo movil: performance 74 (< 80)
- Lighthouse plataforma-detalle movil: performance 66 (< 80)
- Lighthouse plataforma-bitacora movil: performance 74 (< 80)
- Lighthouse plataforma-vista-previa movil: performance 77 (< 80)
- Lighthouse plataforma-observabilidad movil: performance 57 (< 80)
- Lighthouse plataforma-comodin movil: performance 54 (< 80)
- Lighthouse vp-encargado movil: performance 57 (< 80)
- Lighthouse vp-mesero movil: performance 51 (< 80)

## Resultados por estado

axe: critical/serious/moderate/minor (reglas violadas). WAVE: errors/contrast/alerts. Lighthouse: accessibility/performance/best-practices/seo.

| Estado | Tipo | Vista | axe | WAVE | Lighthouse |
|---|---|---|---|---|---|
| Acceso (`acceso`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/96/100/100 |
| Acceso (`acceso`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/67/100/100 |
| Raíz (redirige al acceso sin sesión) (`raiz`) | Redirección | escritorio | 0/0/0/0 | 0/0/0 | 100/98/100/100 |
| Raíz (redirige al acceso sin sesión) (`raiz`) | Redirección | movil | 0/0/0/0 | 0/0/0 | 100/67/100/100 |
| Plataforma: acceso (`plataforma-acceso`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/98/100/63 |
| Plataforma: acceso (`plataforma-acceso`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/81/100/63 |
| Vista previa sin código válido (`vista-previa-sin-codigo`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/99/100/63 |
| Vista previa sin código válido (`vista-previa-sin-codigo`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/66/100/63 |
| Pedidos: mesas del mesero (`pedidos`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/89/100/63 |
| Pedidos: mesas del mesero (`pedidos`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/65/100/63 |
| Toma de pedido (mesa libre) (`pedidos-nuevo`) | Ruta | escritorio | 0/0/0/0 | 0/0/1 | 100/98/100/63 |
| Toma de pedido (mesa libre) (`pedidos-nuevo`) | Ruta | movil | 0/0/0/0 | 0/0/1 | 100/60/100/63 |
| Detalle del pedido (mesero) (`pedido-detalle-mesero`) | Ruta | escritorio | 0/0/0/0 | 0/0/1 | 100/98/100/63 |
| Detalle del pedido (mesero) (`pedido-detalle-mesero`) | Ruta | movil | 0/0/0/0 | 0/0/1 | 100/50/100/63 |
| Agregar platos a un pedido (`pedido-agregar`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/95/100/63 |
| Agregar platos a un pedido (`pedido-agregar`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/57/100/63 |
| Cocina (`cocina`) | Ruta | escritorio | 0/0/0/0 | 0/0/9 | 100/89/100/63 |
| Cocina (`cocina`) | Ruta | movil | 0/0/0/0 | 0/0/12 | 100/46/100/63 |
| Mi perfil (`perfil`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/99/100/63 |
| Mi perfil (`perfil`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/66/100/63 |
| Imprimir comanda (`imprimir-comanda`) | Ruta | escritorio | 0/0/0/0 | 0/0/3 | 100/96/100/63 |
| Imprimir comanda (`imprimir-comanda`) | Ruta | movil | 0/0/0/0 | 0/0/3 | 100/57/100/63 |
| Imprimir precuenta (`imprimir-cuenta`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/98/100/63 |
| Imprimir precuenta (`imprimir-cuenta`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/55/100/63 |
| Tablero (cuenta de cocina) (`tablero-cocina`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/63/100/63 |
| Tablero (cuenta de cocina) (`tablero-cocina`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/50/100/63 |
| Pedidos (encargado) (`pedidos-encargado`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/67/100/63 |
| Pedidos (encargado) (`pedidos-encargado`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/47/100/63 |
| Detalle del pedido servido (encargado) (`pedido-detalle`) | Ruta | escritorio | 0/0/0/0 | 0/0/1 | 100/81/100/63 |
| Detalle del pedido servido (encargado) (`pedido-detalle`) | Ruta | movil | 0/0/0/0 | 0/0/1 | 100/60/100/63 |
| Detalle del pedido cobrado (`pedido-cobrado`) | Ruta | escritorio | 0/0/0/0 | 0/0/1 | 100/95/100/63 |
| Detalle del pedido cobrado (`pedido-cobrado`) | Ruta | movil | 0/0/0/0 | 0/0/1 | 100/44/100/63 |
| Tablero (`tablero`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/56/100/63 |
| Tablero (`tablero`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/41/100/63 |
| Historial de pedidos (`historial`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/58/100/63 |
| Historial de pedidos (`historial`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/58/100/63 |
| Comprobantes (`comprobantes`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/98/100/63 |
| Comprobantes (`comprobantes`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/52/100/63 |
| Imprimir comprobante (`comprobante-imprimir`) | Ruta | escritorio | 0/0/0/0 | 0/0/1 | 100/97/100/63 |
| Imprimir comprobante (`comprobante-imprimir`) | Ruta | movil | 0/0/0/0 | 0/0/1 | 100/44/100/63 |
| Reservas (`reservas`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/78/100/63 |
| Reservas (`reservas`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/39/100/63 |
| Clientes (`clientes`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/98/100/63 |
| Clientes (`clientes`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/46/100/63 |
| Caja (`caja`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/96/100/63 |
| Caja (`caja`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/63/100/63 |
| Menú (`menu`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/94/100/63 |
| Menú (`menu`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/48/100/63 |
| Mesas (`mesas`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/98/100/63 |
| Mesas (`mesas`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/45/100/63 |
| Inventario (`inventario`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/95/100/63 |
| Inventario (`inventario`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/48/100/63 |
| Editor de receta (`receta`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/99/100/63 |
| Editor de receta (`receta`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/43/100/63 |
| Personal (`personal`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/86/100/63 |
| Personal (`personal`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/38/100/63 |
| Roles y permisos (`roles`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/38/100/63 |
| Roles y permisos (`roles`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/65/100/63 |
| Indicadores (panel BI) (`panel`) | Ruta | escritorio | 0/0/0/0 | 0/0/28 | 100/98/100/63 |
| Indicadores (panel BI) (`panel`) | Ruta | movil | 0/0/0/0 | 0/0/28 | 100/51/100/63 |
| Panel: reposición (`panel-reposicion`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/98/100/63 |
| Panel: reposición (`panel-reposicion`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/58/100/63 |
| Panel: decisiones de la IA (`panel-ia`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/99/100/63 |
| Panel: decisiones de la IA (`panel-ia`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/73/100/63 |
| Ruta inexistente (redirige al inicio) (`comodin`) | Redirección | escritorio | 0/0/0/0 | 0/0/0 | 100/99/100/63 |
| Ruta inexistente (redirige al inicio) (`comodin`) | Redirección | movil | 0/0/0/0 | 0/0/0 | 100/44/100/63 |
| Plataforma: restaurantes (`plataforma`) | Ruta | escritorio | 0/0/0/0 | 0/0/1 | 100/99/100/63 |
| Plataforma: restaurantes (`plataforma`) | Ruta | movil | 0/0/0/0 | 0/0/1 | 100/62/100/63 |
| Plataforma: nuevo restaurante (`plataforma-nuevo`) | Ruta | escritorio | 0/0/0/0 | 0/0/1 | 100/98/100/63 |
| Plataforma: nuevo restaurante (`plataforma-nuevo`) | Ruta | movil | 0/0/0/0 | 0/0/1 | 100/74/100/63 |
| Plataforma: detalle del restaurante (`plataforma-detalle`) | Ruta | escritorio | 0/0/0/0 | 0/0/1 | 100/98/100/63 |
| Plataforma: detalle del restaurante (`plataforma-detalle`) | Ruta | movil | 0/0/0/0 | 0/0/1 | 100/66/100/63 |
| Plataforma: bitácora (`plataforma-bitacora`) | Ruta | escritorio | 0/0/0/0 | 0/0/1 | 100/98/100/63 |
| Plataforma: bitácora (`plataforma-bitacora`) | Ruta | movil | 0/0/0/0 | 0/0/1 | 100/74/100/63 |
| Plataforma: vista previa (`plataforma-vista-previa`) | Ruta | escritorio | 0/0/0/0 | 0/0/1 | 100/96/100/63 |
| Plataforma: vista previa (`plataforma-vista-previa`) | Ruta | movil | 0/0/0/0 | 0/0/1 | 100/77/100/63 |
| Plataforma: observabilidad (`plataforma-observabilidad`) | Ruta | escritorio | 0/0/0/0 | 0/0/14 | 100/97/100/63 |
| Plataforma: observabilidad (`plataforma-observabilidad`) | Ruta | movil | 0/0/0/0 | 0/0/14 | 100/57/100/63 |
| Plataforma: ruta inexistente (redirige) (`plataforma-comodin`) | Redirección | escritorio | 0/0/0/0 | 0/0/1 | 100/98/100/63 |
| Plataforma: ruta inexistente (redirige) (`plataforma-comodin`) | Redirección | movil | 0/0/0/0 | 0/0/1 | 100/54/100/63 |
| Vista previa como encargado (`vp-encargado`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/98/100/63 |
| Vista previa como encargado (`vp-encargado`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/57/100/63 |
| Vista previa como mesero (`vp-mesero`) | Ruta | escritorio | 0/0/0/0 | 0/0/0 | 100/99/100/63 |
| Vista previa como mesero (`vp-mesero`) | Ruta | movil | 0/0/0/0 | 0/0/0 | 100/51/100/63 |
| Sheet «Más» del encargado (`o-mas`) | Sheet | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Sheet «Cuenta» del mesero (`o-cuenta`) | Sheet | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Menú del widget de accesibilidad (Sienna) (`o-widget`) | Widget | escritorio | 0/0/0/0 | 0/0/22 | no aplica |
| Menú del widget de accesibilidad desde «Cuenta» (`o-widget-movil`) | Widget | movil | 0/0/0/0 | 0/0/22 | no aplica |
| Confirmar salir con pedidos sin enviar (`o-salir-pendientes`) | AlertDialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar salir con pedidos sin enviar (desde «Cuenta») (`o-salir-pendientes-movil`) | AlertDialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Aviso de pedidos sin enviar (sin señal) (`e-cola`) | Estado | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Aviso de pedidos sin enviar (sin señal) (`e-cola`) | Estado | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar salir de la vista previa con pedidos sin enviar (`o-vp-salir`) | AlertDialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar salir de la vista previa con pedidos sin enviar (`o-vp-salir`) | AlertDialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Pedido para llevar o delivery» (`o-llevar`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Pedido para llevar o delivery» (`o-llevar`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Pestaña «Llevar y delivery» (`t-llevar`) | Tabs | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Pestaña «Llevar y delivery» (`t-llevar`) | Tabs | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Pestaña «Mis pedidos» (`t-mis-pedidos`) | Tabs | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Pestaña «Mis pedidos» (`t-mis-pedidos`) | Tabs | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo de opciones del plato (`o-opciones`) | Dialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo de opciones del plato (`o-opciones`) | Dialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Sheet «Resumen» del pedido (`o-resumen`) | Sheet | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Sheet «Resumen» del pedido (`o-resumen`) | Sheet | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo de nota del plato (`o-nota`) | Dialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo de nota del plato (`o-nota`) | Dialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo de cobro (`o-cobro`) | Dialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo de cobro (`o-cobro`) | Dialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Cobro con «Invitar un plato» abierto (`o-cobro-cortesia`) | Dialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Cobro con «Invitar un plato» abierto (`o-cobro-cortesia`) | Dialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Cobro en partes iguales (`o-cobro-partes`) | Dialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Cobro en partes iguales (`o-cobro-partes`) | Dialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Cobro por platos (`o-cobro-platos`) | Dialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Cobro por platos (`o-cobro-platos`) | Dialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Cobro con «Aplicar descuento» abierto (`o-cobro-descuento`) | Dialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Cobro con «Aplicar descuento» abierto (`o-cobro-descuento`) | Dialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo «Cancelar pedido» (`o-cancelar`) | Dialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo «Cancelar pedido» (`o-cancelar`) | Dialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo «Cambiar de mesa» (`o-cambiar-mesa`) | Dialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo «Cambiar de mesa» (`o-cambiar-mesa`) | Dialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo «Unir otra mesa» (`o-unir-mesa`) | Dialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo «Unir otra mesa» (`o-unir-mesa`) | Dialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo «Emitir boleta o factura» (`o-comprobante`) | Dialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo «Emitir boleta o factura» (`o-comprobante`) | Dialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Cancelar desde el tablero (`o-tablero-cancelar`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Cancelar desde el tablero (`o-tablero-cancelar`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Historial: detalle desplegado (`d-historial`) | Desplegable | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Historial: detalle desplegado (`d-historial`) | Desplegable | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo del turno de caja (`o-turno`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo del turno de caja (`o-turno`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Caja: «Descuentos del mesero» desplegado (`d-descuentos`) | Desplegable | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Caja: «Descuentos del mesero» desplegado (`d-descuentos`) | Desplegable | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Comprobantes: «Datos fiscales» desplegado (`d-datos-fiscales`) | Desplegable | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Comprobantes: «Datos fiscales» desplegado (`d-datos-fiscales`) | Desplegable | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nueva categoría» (`o-nueva-categoria`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nueva categoría» (`o-nueva-categoria`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nuevo plato» (`o-nuevo-plato`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nuevo plato» (`o-nuevo-plato`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar categoría» (`o-editar-categoria`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar categoría» (`o-editar-categoria`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar plato» (con opciones) (`o-editar-plato`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar plato» (con opciones) (`o-editar-plato`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar desactivar categoría (`o-desactivar-categoria`) | AlertDialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar desactivar categoría (`o-desactivar-categoria`) | AlertDialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar desactivar plato (`o-desactivar-plato`) | AlertDialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar desactivar plato (`o-desactivar-plato`) | AlertDialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar eliminar categoría vacía (`o-eliminar-categoria`) | AlertDialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar eliminar categoría vacía (`o-eliminar-categoria`) | AlertDialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nueva mesa» (`o-nueva-mesa`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nueva mesa» (`o-nueva-mesa`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Renombrar mesa» (`o-renombrar-mesa`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Renombrar mesa» (`o-renombrar-mesa`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Inventario: pestaña Movimientos (`t-movimientos`) | Tabs | escritorio | 0/0/0/0 | 0/0/18 | no aplica |
| Inventario: pestaña Movimientos (`t-movimientos`) | Tabs | movil | 0/0/0/0 | 0/0/18 | no aplica |
| Inventario: pestaña Alertas (`t-alertas`) | Tabs | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Inventario: pestaña Alertas (`t-alertas`) | Tabs | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Inventario: pestaña Recetas (`t-recetas`) | Tabs | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Inventario: pestaña Recetas (`t-recetas`) | Tabs | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Inventario: pestaña Compras (`t-compras`) | Tabs | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Inventario: pestaña Compras (`t-compras`) | Tabs | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Inventario: pestaña Proveedores (`t-proveedores`) | Tabs | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Inventario: pestaña Proveedores (`t-proveedores`) | Tabs | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nuevo insumo» (`o-nuevo-insumo`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nuevo insumo» (`o-nuevo-insumo`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Compra» de un insumo (`o-compra`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Compra» de un insumo (`o-compra`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Merma» de un insumo (`o-merma`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Merma» de un insumo (`o-merma`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Ajuste» de un insumo (`o-ajuste`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Ajuste» de un insumo (`o-ajuste`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar insumo» (`o-editar-insumo`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar insumo» (`o-editar-insumo`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nueva orden de compra» (`o-nueva-orden`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nueva orden de compra» (`o-nueva-orden`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Recibir la orden» (`o-recibir-orden`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Recibir la orden» (`o-recibir-orden`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nuevo proveedor» (`o-nuevo-proveedor`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nuevo proveedor» (`o-nuevo-proveedor`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar proveedor» (`o-editar-proveedor`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar proveedor» (`o-editar-proveedor`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nueva cuenta» (`o-nueva-cuenta`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nueva cuenta» (`o-nueva-cuenta`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar cuenta» (`o-editar-cuenta`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar cuenta» (`o-editar-cuenta`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Contraseña» de una cuenta (`o-clave-cuenta`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Contraseña» de una cuenta (`o-clave-cuenta`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar desactivar cuenta (`o-desactivar-cuenta`) | AlertDialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar desactivar cuenta (`o-desactivar-cuenta`) | AlertDialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nuevo rol» (`o-nuevo-rol`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nuevo rol» (`o-nuevo-rol`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar el rol Mesero» (`o-editar-rol`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar el rol Mesero» (`o-editar-rol`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Permisos del rol Encargado» (`o-ver-rol`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Permisos del rol Encargado» (`o-ver-rol`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar eliminar rol (`o-eliminar-rol`) | AlertDialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Confirmar eliminar rol (`o-eliminar-rol`) | AlertDialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nueva reserva» (`o-nueva-reserva`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nueva reserva» (`o-nueva-reserva`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar reserva» (`o-editar-reserva`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar reserva» (`o-editar-reserva`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nuevo cliente» (`o-nuevo-cliente`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Nuevo cliente» (`o-nuevo-cliente`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Sheet con la ficha del cliente (`o-ficha-cliente`) | Sheet | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Sheet con la ficha del cliente (`o-ficha-cliente`) | Sheet | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar cliente» desde la ficha (`o-editar-cliente`) | Dialog | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Editar cliente» desde la ficha (`o-editar-cliente`) | Dialog | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Panel: rango personalizado (`e-panel-personalizado`) | Estado | escritorio | 0/0/0/0 | 0/0/28 | no aplica |
| Panel: rango personalizado (`e-panel-personalizado`) | Estado | movil | 0/0/0/0 | 0/0/28 | no aplica |
| Panel: gráfico como tabla (`e-panel-tabla`) | Estado | escritorio | 0/0/0/0 | 0/0/28 | no aplica |
| Panel: gráfico como tabla (`e-panel-tabla`) | Estado | movil | 0/0/0/0 | 0/0/28 | no aplica |
| Panel IA: JSON desplegado (`e-ia-json`) | Desplegable | escritorio | 0/0/0/0 | 0/0/0 | no aplica |
| Panel IA: JSON desplegado (`e-ia-json`) | Desplegable | movil | 0/0/0/0 | 0/0/0 | no aplica |
| Diálogo «Agregar encargado» (`o-agregar-encargado`) | Dialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Diálogo «Agregar encargado» (`o-agregar-encargado`) | Dialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Confirmar desactivar restaurante (`o-desactivar-restaurante`) | AlertDialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Confirmar desactivar restaurante (`o-desactivar-restaurante`) | AlertDialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Confirmar reiniciar el local de muestra (`o-reiniciar-muestra`) | AlertDialog | escritorio | 0/0/0/0 | 0/0/1 | no aplica |
| Confirmar reiniciar el local de muestra (`o-reiniciar-muestra`) | AlertDialog | movil | 0/0/0/0 | 0/0/1 | no aplica |
| Observabilidad: gráfico como tabla (`e-obs-tabla`) | Estado | escritorio | 0/0/0/0 | 0/0/14 | no aplica |
| Observabilidad: gráfico como tabla (`e-obs-tabla`) | Estado | movil | 0/0/0/0 | 0/0/14 | no aplica |
| Observabilidad: detalle de un registro (`e-obs-detalle`) | Desplegable | escritorio | 0/0/0/0 | 0/0/14 | no aplica |
| Observabilidad: detalle de un registro (`e-obs-detalle`) | Desplegable | movil | 0/0/0/0 | 0/0/14 | no aplica |

## Rutas del router

| Ruta | Estados | axe | WAVE | Lighthouse |
|---|---|---|---|---|
| `/` | raiz | sí | sí | sí |
| `/acceso` | acceso | sí | sí | sí |
| `/pedidos` | pedidos, pedidos-encargado | sí | sí | sí |
| `/pedidos/nuevo` | pedidos-nuevo | sí | sí | sí |
| `/pedidos/:orderId` | pedido-detalle-mesero, pedido-detalle, pedido-cobrado | sí | sí | sí |
| `/pedidos/:orderId/agregar` | pedido-agregar | sí | sí | sí |
| `/perfil` | perfil | sí | sí | sí |
| `/tablero` | tablero-cocina, tablero | sí | sí | sí |
| `/tablero/historial` | historial | sí | sí | sí |
| `/cocina` | cocina | sí | sí | sí |
| `/imprimir/:orderId/:kind` | imprimir-comanda, imprimir-cuenta | sí | sí | sí |
| `/comprobantes` | comprobantes | sí | sí | sí |
| `/comprobantes/:invoiceId/imprimir` | comprobante-imprimir | sí | sí | sí |
| `/reservas` | reservas | sí | sí | sí |
| `/clientes` | clientes | sí | sí | sí |
| `/caja` | caja | sí | sí | sí |
| `/menu` | menu | sí | sí | sí |
| `/mesas` | mesas | sí | sí | sí |
| `/inventario` | inventario | sí | sí | sí |
| `/inventario/recetas/:menuItemId` | receta | sí | sí | sí |
| `/personal` | personal | sí | sí | sí |
| `/roles` | roles | sí | sí | sí |
| `/panel` | panel | sí | sí | sí |
| `/panel/reposicion` | panel-reposicion | sí | sí | sí |
| `/panel/ia` | panel-ia | sí | sí | sí |
| `*` | comodin | sí | sí | sí |
| `/plataforma/acceso` | plataforma-acceso | sí | sí | sí |
| `/plataforma` | plataforma | sí | sí | sí |
| `/plataforma/restaurantes/nuevo` | plataforma-nuevo | sí | sí | sí |
| `/plataforma/restaurantes/:restaurantId` | plataforma-detalle | sí | sí | sí |
| `/plataforma/bitacora` | plataforma-bitacora | sí | sí | sí |
| `/plataforma/vista-previa` | plataforma-vista-previa | sí | sí | sí |
| `/plataforma/observabilidad` | plataforma-observabilidad | sí | sí | sí |
| `/plataforma/*` | plataforma-comodin | sí | sí | sí |
| `/vista-previa` | vista-previa-sin-codigo, vp-encargado, vp-mesero | sí | sí | sí |

## Widget Sienna (axe con y sin el widget, rutas)

| Medición | critical | serious | moderate | minor |
|---|---|---|---|---|
| Con el widget (84 mediciones) | 0 | 0 | 0 | 0 |
| Sin el widget (84 mediciones) | 0 | 0 | 0 | 0 |
