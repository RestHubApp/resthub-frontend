import type { AiDecision } from '../../api/types'
import DataTable, { type DataColumn } from '../../components/DataTable'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import AiDecisionDetail from './AiDecisionDetail'
import { DEFAULT_TIME_ZONE } from './dateRange'
import EngineBadge from './EngineBadge'
import { formatConfidence, formatDateTime } from './format'

const SUBJECTS: Record<AiDecision['subject_type'], string> = {
  ingredient: 'Insumo',
  order: 'Pedido',
  order_item: 'Plato de un pedido',
  stock_movement: 'Merma',
}

// Lo que decidió, en una línea: la acción, el tipo de nota o la causa.
function resumen(decision: AiDecision): string {
  const salida = decision.output
  const texto = ['action_label', 'note_type_label', 'cause_label', 'action', 'note_type', 'cause']
    .map((clave) => salida[clave])
    .find((valor) => typeof valor === 'string')
  return typeof texto === 'string' ? texto : '—'
}

const COLUMNS: DataColumn<AiDecision>[] = [
  { id: 'fecha', header: 'Fecha', cell: (d) => formatDateTime(d.created_at, DEFAULT_TIME_ZONE), className: 'whitespace-nowrap' },
  { id: 'tipo', header: 'Tipo', cell: (d) => d.kind_label },
  { id: 'sujeto', header: 'Sobre', cell: (d) => `${SUBJECTS[d.subject_type]} #${String(d.subject_id)}` },
  { id: 'decision', header: 'Decisión', cell: resumen },
  {
    id: 'motor',
    header: 'Motor',
    cell: (d) => <EngineBadge engine={d.engine} fallbackReason={d.fallback_reason} fallbackLabel={d.fallback_label} />,
  },
  { id: 'confianza', header: 'Confianza', cell: (d) => formatConfidence(d.confidence), className: 'text-right tabular-nums' },
  {
    id: 'detalle',
    header: 'Detalle',
    cell: (_, fila) => (
      <Button type="button" variant="ghost" size="sm" aria-expanded={fila.isExpanded} onClick={fila.toggleExpanded}>
        <Icon name="expandir" size={14} className={fila.isExpanded ? 'rotate-180' : undefined} />
        <span>{fila.isExpanded ? 'Ocultar' : 'Ver JSON'}</span>
      </Button>
    ),
  },
]

interface AiDecisionTableProps {
  readonly decisions: readonly AiDecision[]
  readonly isLoading: boolean
}

/** Cada decisión guardada, con su entrada y salida a un clic. */
export default function AiDecisionTable({ decisions, isLoading }: AiDecisionTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      data={decisions}
      isLoading={isLoading}
      emptyMessage="No hay decisiones con esos filtros."
      getRowId={(d) => String(d.id)}
      renderExpanded={(d) => <AiDecisionDetail decision={d} />}
    />
  )
}
