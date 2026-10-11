import type { DecisionEngine, DecisionKind } from '@/api/types'
import { FilterSelect } from './FilterSelect'

const KINDS: readonly { value: DecisionKind; label: string }[] = [
  { value: 'restock', label: 'Reposición de insumo' },
  { value: 'order_note', label: 'Nota de pedido' },
  { value: 'waste_cause', label: 'Causa de merma' },
]
const ENGINES: readonly { value: DecisionEngine; label: string }[] = [
  { value: 'jev', label: 'Jev (IA)' },
  { value: 'rules', label: 'Reglas fijas' },
]

interface AiDecisionFiltersProps {
  readonly kind: DecisionKind | ''
  readonly engine: DecisionEngine | ''
  readonly onKindChange: (value: DecisionKind | '') => void
  readonly onEngineChange: (value: DecisionEngine | '') => void
}

/** Los filtros de la bitácora: por tipo de decisión y por motor. */
export function AiDecisionFilters({ kind, engine, onKindChange, onEngineChange }: AiDecisionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <FilterSelect label="Tipo" value={kind} options={KINDS} allLabel="Todos los tipos" onChange={onKindChange} />
      <FilterSelect label="Motor" value={engine} options={ENGINES} allLabel="Todos los motores" onChange={onEngineChange} />
    </div>
  )
}
