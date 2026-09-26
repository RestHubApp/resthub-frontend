import type { ReactElement } from 'react'

import FormMessage from '../../components/FormMessage'
import ListSkeleton from '../../components/ListSkeleton'
import { errorMessage } from '../../services/api'

interface ReportStateProps<T> {
  readonly data: T | undefined
  readonly error: unknown
  readonly errorText: string
  readonly children: (data: T) => ReactElement
  /** La silueta mientras carga. Por defecto, un bloque del alto de un gráfico. */
  readonly skeleton?: ReactElement
}

const BLOQUE = <ListSkeleton label="Cargando…" count={1} itemClassName="h-48 rounded-xl" />

/** Carga, error o el contenido de un reporte, igual en cada sección. */
export default function ReportState<T>({
  data,
  error,
  errorText,
  children,
  skeleton = BLOQUE,
}: ReportStateProps<T>): ReactElement {
  if (data !== undefined) {
    return children(data)
  }
  if (error !== null && error !== undefined) {
    return <FormMessage tone="error">{errorMessage(error, errorText)}</FormMessage>
  }
  return skeleton
}
