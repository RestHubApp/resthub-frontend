import { QueryClient, type QueryExecuteOptions, type QueryKey } from '@tanstack/react-query'

import { shouldRetry } from './apiError'

/**
 * El caché de datos de la aplicación.
 *
 * Vive en su propio módulo, y no dentro de `main.tsx`, para que la sesión lo
 * vacíe al cerrarse: los datos de una cuenta no pueden quedar a la vista de la
 * siguiente que entra en el mismo navegador.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Sin señal, TanStack Query pausa una mutación (`networkMode: 'online'`)
      // y la manda sola al volver la conexión: el botón quedaba en «Cobrando…»
      // y el cobro o la anulación llegaban minutos después, sin que nadie lo
      // supiera. Cobrar, cambiar estados o editar necesitan señal: sin ella la
      // petición falla en el acto y se avisa. Lo que sí espera la señal (un
      // pedido nuevo) lo guarda la cola propia del celular (`store/offlineQueue`).
      networkMode: 'always',
    },
  },
})

// Una precarga que falla no avisa: la pantalla vuelve a pedir y muestra su error.
function ignore(): undefined {
  return undefined
}

/**
 * Pide una consulta por adelantado, sin esperarla.
 *
 * Si ya está en el caché y no pasó su `staleTime`, no viaja al servidor; si
 * ya va en camino, se suma a esa misma petición.
 */
export function prefetch<TData, TKey extends QueryKey>(
  options: QueryExecuteOptions<TData, Error, TData, TData, TKey>,
): void {
  queryClient.query(options).catch(ignore)
}

/**
 * La raíz de las claves del administrador del sistema, de consultas y de
 * mutaciones. Es solo orden: la sesión es una y al cerrarse se vacía por completo.
 */
export const PLATFORM_QUERY_ROOT = 'platform'

/**
 * Vacía el caché de una sesión que se cierra: consultas y mutaciones.
 *
 * El de mutaciones guarda lo que se envió (en un alta, la contraseña del
 * encargado). Nada de esa cuenta queda a la vista de la siguiente que entra en
 * el mismo navegador.
 */
export function clearQueries(): void {
  queryClient.clear()
}
