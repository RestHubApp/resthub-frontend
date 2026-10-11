import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
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

function cashSessionsQueryKey(offset: number) {
  return [...cashQueryKey, 'sessions', offset] as const
}

function cashSessionQueryKey(sessionId: number) {
  return [...cashQueryKey, 'session', sessionId] as const
}

/**
 * Si se puede cobrar. El encargado recibe además el arqueo en curso; el
 * mesero, solo si la caja está abierta.
 */
export async function fetchCurrentCash(): Promise<CurrentCash> {
  return send((client) => client.GET('/api/v1/cash/current'))
}

export const currentCashQuery = queryOptions({
  queryKey: currentCashQueryKey,
  queryFn: fetchCurrentCash,
})

export const CASH_PAGE_SIZE = 10

async function fetchCashSessions(offset: number): Promise<CashSessionPage> {
  return send((client) => client.GET('/api/v1/cash/sessions', { params: { query: { limit: CASH_PAGE_SIZE, offset } } }))
}

export function cashSessionsQuery(offset: number) {
  return queryOptions({
    queryKey: cashSessionsQueryKey(offset),
    queryFn: () => fetchCashSessions(offset),
  })
}

async function fetchCashSession(sessionId: number): Promise<CashSession> {
  return send((client) =>
    client.GET('/api/v1/cash/sessions/{session_id}', { params: { path: { session_id: sessionId } } }),
  )
}

export async function openCash(payload: OpenCashRequest): Promise<CashSession> {
  return send((client) => client.POST('/api/v1/cash/open', { body: payload }))
}

export async function closeCash(payload: CloseCashRequest): Promise<CashSession> {
  return send((client) => client.POST('/api/v1/cash/close', { body: payload }))
}

export function cashSessionQuery(sessionId: number) {
  return queryOptions({ queryKey: cashSessionQueryKey(sessionId), queryFn: () => fetchCashSession(sessionId) })
}
