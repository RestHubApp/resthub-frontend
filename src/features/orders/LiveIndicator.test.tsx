import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { LiveIndicator } from './LiveIndicator'
import { OrderStatusBadge } from './OrderStatusBadge'
import { QueryError } from './QueryError'

describe('LiveIndicator', () => {
  it.each([
    ['connecting', 'Conectando…'],
    ['live', 'En vivo'],
    ['offline', 'Sin conexión · reintentando'],
  ] as const)('con el canal %s anuncia «%s»', (status, text) => {
    render(<LiveIndicator status={status} />)

    expect(screen.getByRole('status')).toHaveTextContent(text)
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
    const retry = jest.fn()
    render(<QueryError error={new Error('red')} fallback="No se pudo cargar el pedido." onRetry={retry} />)

    expect(screen.getByText('No se pudo cargar el pedido.')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(retry).toHaveBeenCalledTimes(1)
  })
})
