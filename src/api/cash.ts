import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
import type {
  CashSession,
  CashSessionPage,
  CloseCashRequest,
  CurrentCash,
  OpenCashRequest,
} from './types'

// La caja del local: un turno abierto a la vez, con su arqueo al cerrar.

export const cashQueryKey = ['cash'] as const
export const currentCashQueryKey = [...cashQueryKey, 'current'] as const

export function cashSessionsQueryKey(offset: number) {
  return [...cashQueryKey, 'sessions', offset] as const
}

export function cashSessionQueryKey(sessionId: number) {
  return [...cashQueryKey, 'session', sessionId] as const
}

/**
 * Si se puede cobrar. El encargado recibe además el arqueo en curso; el
 * mesero, solo si la caja está abierta.
 */
export async function fetchCurrentCash(): Promise<CurrentCash> {
  const { data } = await api.get<CurrentCash>('/cash/current')
  return data
}

export const currentCashQuery = queryOptions({
  queryKey: currentCashQueryKey,
  queryFn: fetchCurrentCash,
})

export const CASH_PAGE_SIZE = 10

export async function fetchCashSessions(offset: number): Promise<CashSessionPage> {
  const { data } = await api.get<CashSessionPage>('/cash/sessions', {
    params: { limit: CASH_PAGE_SIZE, offset },
  })
  return data
}

export function cashSessionsQuery(offset: number) {
  return queryOptions({
    queryKey: cashSessionsQueryKey(offset),
    queryFn: () => fetchCashSessions(offset),
  })
}

export async function fetchCashSession(sessionId: number): Promise<CashSession> {
  const { data } = await api.get<CashSession>(`/cash/sessions/${String(sessionId)}`)
  return data
}

export async function openCash(payload: OpenCashRequest): Promise<CashSession> {
  const { data } = await api.post<CashSession>('/cash/open', payload)
  return data
}

export async function closeCash(payload: CloseCashRequest): Promise<CashSession> {
  const { data } = await api.post<CashSession>('/cash/close', payload)
  return data
}
