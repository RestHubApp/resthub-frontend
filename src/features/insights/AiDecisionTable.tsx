import type { AiDecision } from '@/api/types'
import { DataTable, type DataColumn } from '@/components/DataTable'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { AiDecisionDetail } from './AiDecisionDetail'
import { EngineBadge } from './EngineBadge'
import { ACTION_LABELS } from './restockActions'
import { useMemo } from 'react'

import { formatConfidence, formatDateTime } from '@/services/format'
import { useTimeZone } from '@/store/session'

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

// Un insumo o una merma se anuncian como tales; un plato ya se entiende junto
// al número de su pedido.
const PREFIXES: Partial<Record<AiDecision['subject_type'], string>> = { ingredient: 'Insumo: ', stock_movement: 'Merma: ' }

// El asunto por su nombre: el número del pedido y el insumo o plato. El id
// solo aparece si el asunto ya no existe y no hay otra forma de nombrarlo.
function subject(decision: AiDecision): string {
  const prefix = PREFIXES[decision.subject_type] ?? ''
  const name = decision.subject_label === null ? null : `${prefix}${decision.subject_label}`
  const order = decision.order_number === null ? null : `Pedido #${String(decision.order_number)}`
  const parts = [name, order].filter((part) => part !== null)
  return parts.length > 0 ? parts.join(' · ') : `${SUBJECTS[decision.subject_type]} (id ${String(decision.subject_id)})`
}

// Jev da una probabilidad; las reglas no tienen una y se dicen como tales.
function confidence(decision: AiDecision): string {
  return decision.confidence_kind === 'rule' ? decision.confidence_kind_label : formatConfidence(decision.confidence)
}

// Lo que decidió, en una línea: la acción, el tipo de nota o la causa.
function summary(decision: AiDecision): string {
  const { key, labels } = OUTPUT_LABELS[decision.kind]
  const code = decision.output[key]
  if (typeof code !== 'string') {
    return '—'
  }
  return labels[code] ?? code
}

function columns(timeZone: string): DataColumn<AiDecision>[] {
  return [
  { id: 'fecha', header: 'Fecha', cell: (d) => formatDateTime(d.created_at, timeZone), className: 'whitespace-nowrap' },
  { id: 'tipo', header: 'Tipo', cell: (d) => d.kind_label },
  { id: 'sujeto', header: 'Sobre', cell: subject },
  { id: 'decision', header: 'Decisión', cell: summary },
  {
    id: 'motor',
    header: 'Motor',
    cell: (d) => <EngineBadge engine={d.engine} fallbackReason={d.fallback_reason} fallbackLabel={d.fallback_label} />,
  },
  { id: 'confianza', header: 'Confianza', cell: confidence, className: 'text-right tabular-nums' },
  {
    id: 'detalle',
    header: 'Detalle',
    cell: (_, row) => (
      <Button type="button" variant="ghost" size="sm" aria-expanded={row.isExpanded} onClick={row.toggleExpanded}>
        <Icon name="expandir" size={14} className={row.isExpanded ? 'rotate-180' : undefined} />
        <span>{row.isExpanded ? 'Ocultar' : 'Ver JSON'}</span>
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
export function AiDecisionTable({ decisions, isLoading }: AiDecisionTableProps) {
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
