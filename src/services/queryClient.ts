import { QueryClient, type QueryExecuteOptions, type QueryKey } from '@tanstack/react-query'

import { debeReintentar } from './api'

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
      retry: debeReintentar,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

// Una precarga que falla no avisa: la pantalla vuelve a pedir y muestra su error.
function ignorar(): undefined {
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
  queryClient.query(options).catch(ignorar)
}

/**
 * Vacía el caché de una sesión que se cierra sin tocar el de la otra.
 *
 * En el mismo navegador pueden estar abiertas la sesión de un restaurante y la
 * del administrador del sistema; cada una guarda sus consultas bajo su propia
 * raíz de clave. Cerrar la del restaurante borra cada consulta salvo las de `keep`, así nada
 * de esa cuenta queda a la vista de la siguiente y la otra sesión sigue igual.
 */
export function clearQueriesExcept(keep: string): void {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== keep })
  queryClient.getMutationCache().clear()
}
