import type { ReactElement } from 'react'

import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import { errorMessage } from '../../services/api'

interface ReportStateProps<T> {
  readonly data: T | undefined
  readonly error: unknown
  readonly errorText: string
  readonly children: (data: T) => ReactElement
}

/** Carga, error o el contenido de un reporte, igual en cada sección. */
export default function ReportState<T>({
  data,
  error,
  errorText,
  children,
}: ReportStateProps<T>): ReactElement {
  if (data !== undefined) {
    return children(data)
  }
  if (error !== null && error !== undefined) {
    return <FormMessage tone="error">{errorMessage(error, errorText)}</FormMessage>
  }
  return <EmptyState title="Cargando…" />
}
