import { queryOptions } from '@tanstack/react-query'

import { SLOW_TIMEOUT_MS } from '@/services/api'
import { send } from './client'
import type {
  AiDecisionPage,
  AiDecisionParams,
  ClassifyWasteResult,
  DailySales,
  DishMargins,
  HourlySales,
  InsightsRangeParams,
  LowStockItem,
  OrderNotesReport,
  PaymentMix,
  RestockReport,
  SalesSummary,
  TopDishes,
  WaiterPerformanceList,
  WasteReport,
} from './types'

// Indicadores del negocio y decisiones de la IA. Son solo del encargado
// (`insights.read`): un mesero recibe 403.

const insightsQueryKey = ['insights'] as const

/** Las consultas de un reporte con rango de fechas. Cambiar el rango es otra consulta. */
function insightsReportKey(report: string, range: InsightsRangeParams) {
  return [...insightsQueryKey, report, range] as const
}

/** Un reporte del rango: la clave y la petición salen juntas para que no diverjan. */
export function insightsReportQuery<T>(
  report: string,
  range: InsightsRangeParams,
  fetcher: (range: InsightsRangeParams) => Promise<T>,
) {
  return queryOptions({ queryKey: insightsReportKey(report, range), queryFn: () => fetcher(range) })
}

const restockQueryKey = [...insightsQueryKey, 'restock'] as const
export const aiDecisionsQueryKey = [...insightsQueryKey, 'ai-decisions'] as const
export const orderNotesQueryKey = [...insightsQueryKey, 'order-notes'] as const
const lowStockQueryKey = [...insightsQueryKey, 'low-stock'] as const

/** La raiz de las claves de un reporte del panel, para invalidarlos todos a la vez. */
export function insightsReportRootKey(report: string) {
  return [...insightsQueryKey, report] as const
}

export function fetchSalesSummary(range: InsightsRangeParams): Promise<SalesSummary> {
  return send((client) => client.GET('/api/v1/insights/summary', { params: { query: range } }))
}

/** El resumen del período, lo primero que muestra el panel. */
export function salesSummaryQuery(range: InsightsRangeParams) {
  return insightsReportQuery('summary', range, fetchSalesSummary)
}

export function fetchDailySales(range: InsightsRangeParams): Promise<DailySales> {
  return send((client) => client.GET('/api/v1/insights/sales/daily', { params: { query: range } }))
}

export function fetchHourlySales(range: InsightsRangeParams): Promise<HourlySales> {
  return send((client) => client.GET('/api/v1/insights/sales/hourly', { params: { query: range } }))
}

export function fetchPaymentMix(range: InsightsRangeParams): Promise<PaymentMix> {
  return send((client) => client.GET('/api/v1/insights/payments', { params: { query: range } }))
}

export function fetchWaiterPerformance(range: InsightsRangeParams): Promise<WaiterPerformanceList> {
  return send((client) => client.GET('/api/v1/insights/waiters', { params: { query: range } }))
}

export function fetchTopDishes(range: InsightsRangeParams, limit = 10): Promise<TopDishes> {
  return send((client) => client.GET('/api/v1/insights/dishes/top', { params: { query: { ...range, limit } } }))
}

export function fetchDishMargins(range: InsightsRangeParams): Promise<DishMargins> {
  return send((client) => client.GET('/api/v1/insights/dishes/margins', { params: { query: range } }))
}

export function fetchWasteReport(range: InsightsRangeParams): Promise<WasteReport> {
  return send((client) => client.GET('/api/v1/insights/waste', { params: { query: range } }))
}

/** Los insumos bajo su mínimo ahora mismo. No depende del rango. */
async function fetchLowStock(): Promise<LowStockItem[]> {
  return send((client) => client.GET('/api/v1/insights/low-stock'))
}

/** Clasifica con la IA el motivo de las mermas que aún no lo tienen. */
export async function classifyWaste(): Promise<ClassifyWasteResult> {
  return send((client) => client.POST('/api/v1/insights/waste/classify'), { timeout: SLOW_TIMEOUT_MS })
}

/** La última recomendación guardada, o una vista previa por reglas si nunca se pidió. */
async function fetchRestock(): Promise<RestockReport> {
  return send((client) => client.GET('/api/v1/insights/restock'))
}

/** Decide de nuevo cada insumo y lo guarda. Con Jev puede tardar varios segundos. */
export async function refreshRestock(): Promise<RestockReport> {
  return send((client) => client.POST('/api/v1/insights/restock/refresh'), { timeout: SLOW_TIMEOUT_MS })
}

async function fetchAiDecisions(params: AiDecisionParams): Promise<AiDecisionPage> {
  return send((client) => client.GET('/api/v1/insights/ai-decisions', { params: { query: params } }))
}

/** El tope de pedidos por consulta que acepta el servidor. */
export const MAX_ORDER_NOTES_ORDERS = 100

/** Cómo leyó la IA las notas de esos pedidos: alergia, preferencia, prioridad u otro. */
async function fetchOrderNotes(orderIds: readonly number[]): Promise<OrderNotesReport> {
  // FastAPI espera la lista como `order_ids=1&order_ids=2`, sin corchetes: la
  // forma por defecto del cliente.
  return send((client) =>
    client.GET('/api/v1/insights/order-notes', {
      params: { query: { order_ids: orderIds.slice(0, MAX_ORDER_NOTES_ORDERS) } },
    }),
  )
}

/** Clasifica las notas pendientes del restaurante (lo normal es que ocurra al enviar a cocina). */
export async function classifyOrderNotes(): Promise<void> {
  await send((client) => client.POST('/api/v1/insights/order-notes/classify'), { timeout: SLOW_TIMEOUT_MS })
}

export const lowStockQuery = queryOptions({ queryKey: lowStockQueryKey, queryFn: fetchLowStock })

export const restockQuery = queryOptions({ queryKey: restockQueryKey, queryFn: fetchRestock })

export function aiDecisionsQuery(params: AiDecisionParams) {
  return queryOptions({
    queryKey: [...aiDecisionsQueryKey, params],
    queryFn: () => fetchAiDecisions(params),
  })
}

export function orderNotesQuery(orderIds: readonly number[]) {
  return queryOptions({
    queryKey: [...orderNotesQueryKey, orderIds],
    queryFn: () => fetchOrderNotes(orderIds),
  })
}
