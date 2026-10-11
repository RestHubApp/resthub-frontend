import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { cashRegisterSummary } from '#jest/fixtures/cash'
import { CashMethodTable } from './CashMethodTable'
import { CashWaiterTable } from './CashWaiterTable'

describe('CashMethodTable', () => {
  it('avisa cuando todavía no hay cobros', () => {
    render(<CashMethodTable rows={[]} />)

    expect(screen.getByText('Todavía no hay cobros en este turno.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('lista cada medio de pago', () => {
    const summary = cashRegisterSummary({
      by_method: [{ method: 'cash', method_label: 'Efectivo', payments: 2, amount: '40.00', tips: '4.00' }],
    })
    render(<CashMethodTable rows={summary.by_method} />)

    expect(screen.getByRole('table', { name: 'Por medio de pago' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Efectivo' })).toBeInTheDocument()
  })
})

describe('CashWaiterTable', () => {
  it('no muestra nada sin propinas por mesero', () => {
    render(<CashWaiterTable rows={[]} />)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('lista a cada mesero con sus propinas', () => {
    const summary = cashRegisterSummary({
      by_waiter: [{ waiter_id: 1, name: 'Luis Rojas', payments: 2, sales: '80.00', tips: '8.00' }],
    })
    render(<CashWaiterTable rows={summary.by_waiter} />)

    expect(screen.getByRole('table', { name: /Propinas por mesero/u })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Luis Rojas' })).toBeInTheDocument()
  })
})
