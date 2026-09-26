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
 * La raíz de las claves del administrador del sistema, de consultas y de
 * mutaciones. Cerrar una sesión de restaurante vacía el caché salvo esto, y
 * cerrar la de plataforma vacía solo esto.
 */
export const PLATFORM_QUERY_ROOT = 'platform'

// El caché de mutaciones guarda lo que se envió: en un alta, la contraseña del
// encargado. Se vacía junto con las consultas de la misma sesión.
function removeMutations(predicate: (mutationKey: readonly unknown[] | undefined) => boolean): void {
  const mutaciones = queryClient.getMutationCache()
  for (const mutacion of mutaciones.findAll({ predicate: (m) => predicate(m.options.mutationKey) })) {
    mutaciones.remove(mutacion)
  }
}

/**
 * Vacía el caché de una sesión que se cierra sin tocar el de la otra.
 *
 * En el mismo navegador pueden estar abiertas la sesión de un restaurante y la
 * del administrador del sistema; cada una guarda sus consultas y mutaciones
 * bajo su propia raíz de clave. Cerrar la del restaurante borra el caché salvo lo
 * de `keep`, así nada de esa cuenta queda a la vista de la siguiente y la otra
 * sesión sigue igual.
 */
export function clearQueriesExcept(keep: string): void {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== keep })
  removeMutations((mutationKey) => mutationKey?.[0] !== keep)
}

/** Lo contrario: vacía solo las consultas y mutaciones bajo `root`. */
export function clearQueriesOf(root: string): void {
  queryClient.removeQueries({ queryKey: [root] })
  removeMutations((mutationKey) => mutationKey?.[0] === root)
}
