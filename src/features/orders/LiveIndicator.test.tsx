import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import LiveIndicator from './LiveIndicator'
import OrderStatusBadge from './OrderStatusBadge'
import QueryError from './QueryError'

describe('LiveIndicator', () => {
  it.each([
    ['connecting', 'Conectando…'],
    ['live', 'En vivo'],
    ['offline', 'Sin conexión · reintentando'],
  ] as const)('con el canal %s anuncia «%s»', (estado, texto) => {
    render(<LiveIndicator status={estado} />)

    expect(screen.getByRole('status')).toHaveTextContent(texto)
  })
})

describe('OrderStatusBadge', () => {
  it('usa el mismo nombre de estado que el tablero', () => {
    render(<OrderStatusBadge status="served" />)

    expect(screen.getByText('Servido, por cobrar')).toBeInTheDocument()
  })
})

describe('QueryError', () => {
  it('muestra el texto de respaldo si el error no trae detalle y reintenta al tocar', async () => {
    const reintentar = jest.fn()
    render(<QueryError error={new Error('red')} fallback="No se pudo cargar el pedido." onRetry={reintentar} />)

    expect(screen.getByText('No se pudo cargar el pedido.')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(reintentar).toHaveBeenCalledTimes(1)
  })
})
