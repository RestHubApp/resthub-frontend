import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { CustomerRecentOrders } from './CustomerRecentOrders'

describe('CustomerRecentOrders', () => {
  it('avisa cuando el cliente todavía no pidió', () => {
    render(
      <MemoryRouter>
        <CustomerRecentOrders orders={[]} timeZone="America/Lima" />
      </MemoryRouter>,
    )
    expect(screen.getByText('Todavía no pidió.')).toBeInTheDocument()
  })

  it('lista los pedidos con su tipo', () => {
    const orders = [{ order_id: 7, number: 12, type: 'takeaway', status: 'paid', total: '10.00', created_at: '2026-01-01T12:00:00Z' }]
    render(
      <MemoryRouter>
        <CustomerRecentOrders orders={orders} timeZone="America/Lima" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link')).toHaveTextContent('#12 · Para llevar')
  })
})
