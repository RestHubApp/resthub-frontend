import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { MovementOrderLink } from './MovementOrderLink'

function show(orderNumber: number | null) {
  render(
    <MemoryRouter>
      <MovementOrderLink orderId={7} orderNumber={orderNumber} />
    </MemoryRouter>,
  )
}

describe('MovementOrderLink', () => {
  it('muestra el número del día del pedido', () => {
    show(12)

    expect(screen.getByRole('link', { name: 'Pedido #12' })).toBeInTheDocument()
  })

  it('sin número, dice Ver pedido', () => {
    show(null)

    expect(screen.getByRole('link', { name: 'Ver pedido' })).toBeInTheDocument()
  })
})
