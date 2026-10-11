import type { UseQueryResult } from '@tanstack/react-query'

import type { AiDecisionPage } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { errorMessage } from '@/services/apiError'
import { AiDecisionTable } from './AiDecisionTable'

interface AiDecisionsListProps {
  readonly decisions: UseQueryResult<AiDecisionPage>
}

/** La tabla de decisiones, atenuada mientras llega otra página, o el error de la carga. */
export function AiDecisionsList({ decisions }: AiDecisionsListProps) {
  if (decisions.isError) {
    return <FormMessage tone="error">{errorMessage(decisions.error, 'No se pudo cargar la auditoría.')}</FormMessage>
  }

  return (
    <div className={`transition-opacity ${decisions.isPlaceholderData ? 'opacity-50' : ''}`}>
      <AiDecisionTable decisions={decisions.data?.items ?? []} isLoading={decisions.isPending} />
    </div>
  )
}
