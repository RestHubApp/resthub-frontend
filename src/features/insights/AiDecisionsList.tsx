import type { UseQueryResult } from '@tanstack/react-query'
import { ErrorMessage } from '@/components/ErrorMessage'

import type { AiDecisionPage } from '@/api/types'
import { AiDecisionTable } from './AiDecisionTable'

interface AiDecisionsListProps {
  readonly decisions: UseQueryResult<AiDecisionPage>
}

/** La tabla de decisiones, atenuada mientras llega otra página, o el error de la carga. */
export function AiDecisionsList({ decisions }: AiDecisionsListProps) {
  if (decisions.isError) {
    return <ErrorMessage error={decisions.error} fallback="No se pudo cargar la auditoría." />
  }

  return (
    <div className={`transition-opacity ${decisions.isPlaceholderData ? 'opacity-50' : ''}`}>
      <AiDecisionTable decisions={decisions.data?.items ?? []} isLoading={decisions.isPending} />
    </div>
  )
}
