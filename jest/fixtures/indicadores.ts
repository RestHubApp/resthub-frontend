// Reposición sugerida y decisiones de la IA para las pruebas, con la forma del API.
import type { AiDecision, RestockItem, RestockReport } from '../../src/api/types'


const DECIDIDO = '2026-09-26T12:00:00Z'
export function insumoARevisar(cambios: Partial<RestockItem> = {}): RestockItem {
  return {
    ingredient_id: 1,
    name: 'Limón',
    unit: 'kg',
    stock: '0.5',
    min_stock: '2',
    below_minimum: true,
    action: 'buy_today',
    action_label: 'Comprar hoy',
    urgency: 3,
    urgency_label: 'Crítica',
    urgency_score: 90,
    coverage_days: '0.7',
    daily_use_7d: '0.75',
    daily_use_28d: '0.6',
    trend: 'rising',
    trend_label: 'Sube',
    usage_change_percent: '25',
    waste_share_percent: '4',
    wasted_28d: '0.2',
    days_since_last_purchase: 3,
    explanation: 'Se acaba mañana y el consumo sube.',
    engine: 'jev',
    engine_label: 'Jev',
    confidence: 0.87,
    model: 'jev-1',
    fallback_reason: null,
    fallback_label: null,
    decided_at: DECIDIDO,
    decision_id: 50,
    is_stale: false,
    ...cambios,
  }
}

export function reposicion(items: RestockItem[], cambios: Partial<RestockReport> = {}): RestockReport {
  const counts: Record<string, number> = {}
  for (const item of items) {
    counts[item.action] = (counts[item.action] ?? 0) + 1
  }
  return { items, counts, refreshed_at: DECIDIDO, ...cambios }
}

export function decision(cambios: Partial<AiDecision> = {}): AiDecision {
  return {
    id: 1,
    kind: 'restock',
    kind_label: 'Reposición de insumo',
    engine: 'jev',
    engine_label: 'Jev',
    confidence: 0.87,
    confidence_kind: 'model',
    confidence_kind_label: 'Del modelo',
    fallback_reason: null,
    fallback_label: null,
    model: 'jev-1',
    subject_type: 'ingredient',
    subject_id: 1,
    subject_label: 'Limón',
    order_number: null,
    input_state: { stock: '0.5' },
    output: { action: 'buy_today' },
    created_at: DECIDIDO,
    ...cambios,
  }
}
