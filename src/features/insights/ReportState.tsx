import type { ReactElement } from 'react'
import { ErrorMessage } from '@/components/ErrorMessage'

import { ListSkeleton } from '@/components/ListSkeleton'

/** Mientras carga: una silueta propia o, por defecto, un bloque del alto de un gráfico con su aviso. */
type ReportLoading = { readonly skeleton: ReactElement } | { readonly loadingLabel: string }

type ReportStateProps<T> = ReportLoading & {
  readonly data: T | undefined
  readonly error: unknown
  readonly errorText: string
  readonly children: (data: T) => ReactElement
}

/** Carga, error o el contenido de un reporte, igual en cada sección. */
export function ReportState<T>(props: ReportStateProps<T>): ReactElement {
  const { data, error, errorText, children } = props
  if (data !== undefined) {
    return children(data)
  }
  if (error !== null && error !== undefined) {
    return <ErrorMessage error={error} fallback={errorText} />
  }
  if ('skeleton' in props) {
    return props.skeleton
  }
  return <ListSkeleton label={props.loadingLabel} count={1} itemClassName="h-48 rounded-xl" />
}
