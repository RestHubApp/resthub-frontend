import { PERMISSION } from '@/api/permissions'
import { SectionCard } from '@/components/SectionCard'
import { TablePagination } from '@/components/TablePagination'
import { useCan } from '@/store/session'
import { AiDecisionFilters } from './AiDecisionFilters'
import { AiDecisionsList } from './AiDecisionsList'
import { ExternalAiCard } from './ExternalAiCard'
import { PanelHeader } from './PanelHeader'
import { useAiDecisions } from './useAiDecisions'

/**
 * La bitácora de la IA: cada decisión con lo que vio el motor, lo que
 * respondió, su confianza y si hubo que recurrir a las reglas.
 */
export function AiAuditView() {
  const audit = useAiDecisions()
  // Encender o apagar la IA externa es una preferencia del local.
  const canManageRestaurant = useCan(PERMISSION.restaurantManage)

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader description="Cada decisión de la IA queda guardada: qué datos vio, qué respondió, con qué confianza y qué motor la tomó." />
      {canManageRestaurant ? <ExternalAiCard /> : null}
      <SectionCard
        title="Decisiones"
        description={audit.decisions.isPending ? 'Cargando…' : `${String(audit.total)} en total con estos filtros.`}
      >
        <AiDecisionFilters
          kind={audit.kind}
          engine={audit.engine}
          onKindChange={audit.changeKind}
          onEngineChange={audit.changeEngine}
        />
        <AiDecisionsList decisions={audit.decisions} />
        {audit.pages > 1 ? <TablePagination actual={audit.page} total={audit.pages} onChange={audit.setPage} /> : null}
      </SectionCard>
    </div>
  )
}
