import type { ReactElement } from 'react'

import ListSkeleton from '../../../components/ListSkeleton'
import PlatformQueryError from '../PlatformQueryError'

interface QueryLike<T> {
  readonly data: T | undefined
  readonly error: unknown
  readonly isError: boolean
  readonly refetch: () => unknown
}

interface ObsQueryStateProps<T> {
  readonly query: QueryLike<T>
  readonly errorText: string
  /** Lo que oye el lector de pantalla mientras carga. */
  readonly loadingLabel: string
  /** El alto de la silueta: el mismo que va a tener el contenido. */
  readonly skeletonClassName: string
  readonly children: (data: T) => ReactElement
}

/**
 * Una lectura del panel: su silueta mientras llega, su error con «Reintentar»
 * si falla, y el contenido cuando hay datos.
 *
 * Si una relectura automática falla, se sigue viendo el error y no el dato
 * viejo como si fuera de ahora.
 */
export default function ObsQueryState<T>({ query, errorText, loadingLabel, skeletonClassName, children }: ObsQueryStateProps<T>) {
  if (query.isError) {
    return <PlatformQueryError error={query.error} fallback={errorText} onRetry={() => void query.refetch()} />
  }
  if (query.data === undefined) {
    return <ListSkeleton label={loadingLabel} count={1} itemClassName={skeletonClassName} />
  }
  return children(query.data)
}
