import type { DocumentLookup } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import * as icons from '@/components/icons'
import { lookupErrorMessage, rucWarning } from './lookupMessages'

interface LookupFeedbackProps {
  /** Lo que falta corregir del formato antes de buscar, o `null`. */
  readonly problem: string | null
  readonly error: unknown
  readonly found: DocumentLookup | undefined
}

/** Lo que dice la búsqueda: el formato por corregir, por qué falló o, de un RUC, que no figura activo y habido. */
export function LookupFeedback({ problem, error, found }: LookupFeedbackProps) {
  const warning = found?.document_type === 'ruc' ? rucWarning(found.status, found.condition) : null

  return (
    <>
      {problem === null ? null : <p className="m-0 text-xs text-muted-foreground">{problem}</p>}
      {error === null ? null : <FormMessage tone="error">{lookupErrorMessage(error)}</FormMessage>}
      {warning === null ? null : <FormMessage tone="warning" icon={icons.alert}>{warning}</FormMessage>}
    </>
  )
}
