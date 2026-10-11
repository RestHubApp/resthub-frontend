import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { aiDecisionsQuery } from '@/api/insights'
import { PERMISSION } from '@/api/permissions'
import type { AiDecisionParams, DecisionEngine, DecisionKind } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { SectionCard } from '@/components/SectionCard'
import { TablePagination } from '@/components/TablePagination'
import { errorMessage } from '@/services/api'
import { useCan } from '@/store/session'
import { AiDecisionTable } from './AiDecisionTable'
import { ExternalAiCard } from './ExternalAiCard'
import { FilterSelect } from './FilterSelect'
import { PanelHeader } from './PanelHeader'

const PAGE_SIZE = 20

const KINDS: readonly { value: DecisionKind; label: string }[] = [
  { value: 'restock', label: 'Reposición de insumo' },
  { value: 'order_note', label: 'Nota de pedido' },
  { value: 'waste_cause', label: 'Causa de merma' },
]
const ENGINES: readonly { value: DecisionEngine; label: string }[] = [
  { value: 'jev', label: 'Jev (IA)' },
  { value: 'rules', label: 'Reglas fijas' },
]

// Un filtro vacío no viaja: el servidor lo entiende como "todos".
function queryParams(kind: DecisionKind | '', engine: DecisionEngine | '', page: number): AiDecisionParams {
  return {
    ...(kind === '' ? {} : { kind }),
    ...(engine === '' ? {} : { engine }),
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }
}

/**
 * La bitácora de la IA: cada decisión con lo que vio el motor, lo que
 * respondió, su confianza y si hubo que recurrir a las reglas.
 */
export function AiAuditView() {
  const [kind, setKind] = useState<DecisionKind | ''>('')
  const [engine, setEngine] = useState<DecisionEngine | ''>('')
  const [page, setPage] = useState(0)
  // Encender o apagar la IA externa es una preferencia del local.
  const canManageRestaurant = useCan(PERMISSION.restaurantManage)
  const params = queryParams(kind, engine, page)
  const decisions = useQuery({ ...aiDecisionsQuery(params), placeholderData: keepPreviousData })
  const total = decisions.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader description="Cada decisión de la IA queda guardada: qué datos vio, qué respondió, con qué confianza y qué motor la tomó." />
      {canManageRestaurant ? <ExternalAiCard /> : null}
      <SectionCard
        title="Decisiones"
        description={decisions.isPending ? 'Cargando…' : `${String(total)} en total con estos filtros.`}
      >
        <div className="flex flex-wrap gap-4">
          <FilterSelect label="Tipo" value={kind} options={KINDS} allLabel="Todos los tipos" onChange={(value) => { setKind(value); setPage(0) }} />
          <FilterSelect label="Motor" value={engine} options={ENGINES} allLabel="Todos los motores" onChange={(value) => { setEngine(value); setPage(0) }} />
        </div>
        {decisions.isError ? (
          <FormMessage tone="error">{errorMessage(decisions.error, 'No se pudo cargar la auditoría.')}</FormMessage>
        ) : (
          <div className={`transition-opacity ${decisions.isPlaceholderData ? 'opacity-50' : ''}`}>
            <AiDecisionTable decisions={decisions.data?.items ?? []} isLoading={decisions.isPending} />
          </div>
        )}
        {pages > 1 ? <TablePagination actual={page} total={pages} onChange={setPage} /> : null}
      </SectionCard>
    </div>
  )
}
