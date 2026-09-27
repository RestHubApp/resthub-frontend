// Datos de caja para las pruebas, con la forma del API.
import type { CashSession, CashSummary, CurrentCash } from '../../src/api/types'

export function resumenDeCaja(cambios: Partial<CashSummary> = {}): CashSummary {
  return {
    by_method: [],
    by_waiter: [],
    courtesies: '0.00',
    discounted_orders: 0,
    discounts: '0.00',
    expected_cash: '150.00',
    opening_amount: '150.00',
    paid_orders: 0,
    sales: '0.00',
    tips: '0.00',
    ...cambios,
  }
}

export function turnoDeCaja(cambios: Partial<CashSession> = {}): CashSession {
  return {
    id: 3,
    is_open: true,
    opened_at: '2026-09-26T13:00:00Z',
    opened_by: 7,
    opened_by_name: 'Ana Torres',
    opening_amount: '150.00',
    opening_notes: '',
    closed_at: null,
    closed_by: null,
    closed_by_name: null,
    closing_notes: '',
    counted_cash: null,
    difference: null,
    expected_cash: null,
    open_orders: 0,
    summary: resumenDeCaja(),
    ...cambios,
  }
}

export const CAJA_CERRADA: CurrentCash = { is_open: false, session: null }

export function cajaAbierta(turno: CashSession = turnoDeCaja()): CurrentCash {
  return { is_open: true, session: turno }
}
