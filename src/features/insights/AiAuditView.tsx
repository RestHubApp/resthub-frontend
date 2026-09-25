import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { aiDecisionsQueryKey, fetchAiDecisions } from '../../api/insights'
import type { AiDecisionParams, DecisionEngine, DecisionKind } from '../../api/types'
import FormMessage from '../../components/FormMessage'
import SectionCard from '../../components/SectionCard'
import TablePagination from '../../components/TablePagination'
import { errorMessage } from '../../services/api'
import AiDecisionTable from './AiDecisionTable'
import FilterSelect from './FilterSelect'
import PanelHeader from './PanelHeader'

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
function queryParams(kind: DecisionKind | '', engine: DecisionEngine | '', pagina: number): AiDecisionParams {
  return {
    ...(kind === '' ? {} : { kind }),
    ...(engine === '' ? {} : { engine }),
    limit: PAGE_SIZE,
    offset: pagina * PAGE_SIZE,
  }
}

/**
 * La bitácora de la IA: cada decisión con lo que vio el motor, lo que
 * respondió, su confianza y si hubo que recurrir a las reglas.
 */
export default function AiAuditView() {
  const [kind, setKind] = useState<DecisionKind | ''>('')
  const [engine, setEngine] = useState<DecisionEngine | ''>('')
  const [pagina, setPagina] = useState(0)
  const params = queryParams(kind, engine, pagina)
  const decisiones = useQuery({
    queryKey: [...aiDecisionsQueryKey, params],
    queryFn: () => fetchAiDecisions(params),
    placeholderData: keepPreviousData,
  })
  const total = decisiones.data?.total ?? 0
  const paginas = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader description="Cada decisión de la IA queda guardada: qué datos vio, qué respondió, con qué confianza y qué motor la tomó." />
      <SectionCard
        title="Decisiones"
        description={decisiones.isPending ? 'Cargando…' : `${String(total)} en total con estos filtros.`}
      >
        <div className="flex flex-wrap gap-4">
          <FilterSelect label="Tipo" value={kind} options={KINDS} allLabel="Todos los tipos" onChange={(valor) => { setKind(valor); setPagina(0) }} />
          <FilterSelect label="Motor" value={engine} options={ENGINES} allLabel="Todos los motores" onChange={(valor) => { setEngine(valor); setPagina(0) }} />
        </div>
        {decisiones.isError ? (
          <FormMessage tone="error">{errorMessage(decisiones.error, 'No se pudo cargar la auditoría.')}</FormMessage>
        ) : (
          <div className={`transition-opacity ${decisiones.isPlaceholderData ? 'opacity-50' : ''}`}>
            <AiDecisionTable decisions={decisiones.data?.items ?? []} isLoading={decisiones.isPending} />
          </div>
        )}
        {paginas > 1 ? <TablePagination actual={pagina} total={paginas} onChange={setPagina} /> : null}
      </SectionCard>
    </div>
  )
}
