import type { OrderListParams, OrderStatus, OrderType } from '../../../api/types'

export interface HistoryFilters {
  readonly from: string
  readonly to: string
  /** Vacio es "cualquiera". */
  readonly status: OrderStatus | ''
  readonly type: OrderType | ''
  readonly waiterId: string
}

export const PAGE_SIZE = 25

/** Los filtros como los espera `GET /orders`, sin los que estan vacios. */
export function toParams(filters: HistoryFilters, page: number): OrderListParams {
  return {
    date_from: filters.from === '' ? null : filters.from,
    date_to: filters.to === '' ? null : filters.to,
    status: filters.status === '' ? null : [filters.status],
    type: filters.type === '' ? null : filters.type,
    waiter_id: filters.waiterId === '' ? null : Number(filters.waiterId),
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }
}
