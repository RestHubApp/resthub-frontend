import { Suspense } from 'react'
import { Outlet } from 'react-router'

import { EmptyState } from '@/components/EmptyState'

// Al abrir la aplicacion directo en una pantalla perezosa (recargar el
// tablero), esto se ve dentro del armazon mientras llega su archivo.
const LOADING = <EmptyState title="Cargando…" />

/**
 * Dónde se ven las pantallas del armazón, con un solo `Suspense` para todas.
 *
 * El router cambia de pantalla en una transición: con el mismo límite de
 * `Suspense` montado de una pantalla a otra, React deja la anterior a la vista
 * hasta que llega el archivo de la nueva, como hacían las rutas perezosas del
 * modo de datos. Un `Suspense` por pantalla se montaría nuevo al pasar de una
 * pantalla pública a una protegida (otra rama del árbol) y mostraría «Cargando…».
 */
export function ScreenOutlet() {
  return (
    <Suspense fallback={LOADING}>
      <Outlet />
    </Suspense>
  )
}
