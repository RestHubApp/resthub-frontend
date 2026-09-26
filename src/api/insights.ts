import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
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

export const insightsQueryKey = ['insights'] as const

/** Las consultas de un reporte con rango de fechas. Cambiar el rango es otra consulta. */
export function insightsReportKey(report: string, range: InsightsRangeParams) {
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

export const restockQueryKey = [...insightsQueryKey, 'restock'] as const
export const aiDecisionsQueryKey = [...insightsQueryKey, 'ai-decisions'] as const
export const orderNotesQueryKey = [...insightsQueryKey, 'order-notes'] as const

async function report<T>(path: string, range: InsightsRangeParams, extra = {}): Promise<T> {
  const { data } = await api.get<T>(`/insights${path}`, { params: { ...range, ...extra } })
  return data
}

export function fetchSalesSummary(range: InsightsRangeParams): Promise<SalesSummary> {
  return report('/summary', range)
}

/** El resumen del período, lo primero que muestra el panel. */
export function salesSummaryQuery(range: InsightsRangeParams) {
  return insightsReportQuery('summary', range, fetchSalesSummary)
}

export function fetchDailySales(range: InsightsRangeParams): Promise<DailySales> {
  return report('/sales/daily', range)
}

export function fetchHourlySales(range: InsightsRangeParams): Promise<HourlySales> {
  return report('/sales/hourly', range)
}

export function fetchPaymentMix(range: InsightsRangeParams): Promise<PaymentMix> {
  return report('/payments', range)
}

export function fetchWaiterPerformance(range: InsightsRangeParams): Promise<WaiterPerformanceList> {
  return report('/waiters', range)
}

export function fetchTopDishes(range: InsightsRangeParams, limit = 10): Promise<TopDishes> {
  return report('/dishes/top', range, { limit })
}

export function fetchDishMargins(range: InsightsRangeParams): Promise<DishMargins> {
  return report('/dishes/margins', range)
}

export function fetchWasteReport(range: InsightsRangeParams): Promise<WasteReport> {
  return report('/waste', range)
}

/** Los insumos bajo su mínimo ahora mismo. No depende del rango. */
export async function fetchLowStock(): Promise<LowStockItem[]> {
  const { data } = await api.get<LowStockItem[]>('/insights/low-stock')
  return data
}

/** Clasifica con la IA el motivo de las mermas que aún no lo tienen. */
export async function classifyWaste(): Promise<ClassifyWasteResult> {
  const { data } = await api.post<ClassifyWasteResult>('/insights/waste/classify')
  return data
}

/** La última recomendación guardada, o una vista previa por reglas si nunca se pidió. */
export async function fetchRestock(): Promise<RestockReport> {
  const { data } = await api.get<RestockReport>('/insights/restock')
  return data
}

/** Decide de nuevo cada insumo y lo guarda. Con Jev puede tardar varios segundos. */
export async function refreshRestock(): Promise<RestockReport> {
  const { data } = await api.post<RestockReport>('/insights/restock/refresh')
  return data
}

export async function fetchAiDecisions(params: AiDecisionParams): Promise<AiDecisionPage> {
  const { data } = await api.get<AiDecisionPage>('/insights/ai-decisions', { params })
  return data
}

/** El tope de pedidos por consulta que acepta el servidor. */
export const MAX_ORDER_NOTES_ORDERS = 100

/** Cómo leyó la IA las notas de esos pedidos: alergia, preferencia, prioridad u otro. */
export async function fetchOrderNotes(orderIds: readonly number[]): Promise<OrderNotesReport> {
  // FastAPI espera la lista como `order_ids=1&order_ids=2`, sin corchetes.
  const { data } = await api.get<OrderNotesReport>('/insights/order-notes', {
    params: { order_ids: orderIds.slice(0, MAX_ORDER_NOTES_ORDERS) },
    paramsSerializer: { indexes: null },
  })
  return data
}

/** Clasifica las notas pendientes del restaurante (lo normal es que ocurra al enviar a cocina). */
export async function classifyOrderNotes(): Promise<void> {
  await api.post('/insights/order-notes/classify')
}
