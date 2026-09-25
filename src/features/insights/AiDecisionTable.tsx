import type { AiDecision } from '../../api/types'
import DataTable, { type DataColumn } from '../../components/DataTable'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import AiDecisionDetail from './AiDecisionDetail'
import EngineBadge from './EngineBadge'
import { ACTION_LABELS } from './restockActions'
import { useMemo } from 'react'

import { formatConfidence, formatDateTime } from '../../services/format'
import { useTimeZone } from '../../store/session'

const SUBJECTS: Record<AiDecision['subject_type'], string> = {
  ingredient: 'Insumo',
  order: 'Pedido',
  order_item: 'Plato de un pedido',
  stock_movement: 'Merma',
}

// La salida guarda códigos; aca se leen en español.
const OUTPUT_LABELS: Record<AiDecision['kind'], { readonly key: string; readonly labels: Partial<Record<string, string>> }> = {
  restock: { key: 'action', labels: ACTION_LABELS },
  order_note: {
    key: 'note_type',
    labels: { allergy: 'Alergia o restricción', preference: 'Preferencia', priority: 'Prioridad', other: 'Otro' },
  },
  waste_cause: {
    key: 'cause',
    labels: {
      expiration: 'Vencimiento',
      mishandling: 'Mala manipulación',
      customer_return: 'Devolución del cliente',
      preparation_error: 'Error de preparación',
      other: 'Otro',
    },
  },
}

// Lo que decidió, en una línea: la acción, el tipo de nota o la causa.
function resumen(decision: AiDecision): string {
  const { key, labels } = OUTPUT_LABELS[decision.kind]
  const codigo = decision.output[key]
  if (typeof codigo !== 'string') {
    return '—'
  }
  return labels[codigo] ?? codigo
}

function columns(timeZone: string): DataColumn<AiDecision>[] {
  return [
  { id: 'fecha', header: 'Fecha', cell: (d) => formatDateTime(d.created_at, timeZone), className: 'whitespace-nowrap' },
  { id: 'tipo', header: 'Tipo', cell: (d) => d.kind_label },
  { id: 'sujeto', header: 'Sobre', cell: (d) => `${SUBJECTS[d.subject_type]} (id ${String(d.subject_id)})` },
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
}

interface AiDecisionTableProps {
  readonly decisions: readonly AiDecision[]
  readonly isLoading: boolean
}

/** Cada decisión guardada, con su entrada y salida a un clic. */
export default function AiDecisionTable({ decisions, isLoading }: AiDecisionTableProps) {
  const timeZone = useTimeZone()
  const columnas = useMemo(() => columns(timeZone), [timeZone])
  return (
    <DataTable
      columns={columnas}
      data={decisions}
      isLoading={isLoading}
      emptyMessage="No hay decisiones con esos filtros."
      getRowId={(d) => String(d.id)}
      renderExpanded={(d) => <AiDecisionDetail decision={d} />}
    />
  )
}
