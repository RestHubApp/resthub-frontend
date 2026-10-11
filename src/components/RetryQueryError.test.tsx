import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { FormMessage } from './FormMessage'
import { RetryQueryError } from './RetryQueryError'

// El aviso del armazón (ApiFailureNotice) se calla solo si la pantalla ya
// ofrece «Reintentar»: lo reconoce por `data-reintento`.
describe('marca de las fallas que ya ofrecen reintentar', () => {
  it('un error de lectura con «Reintentar» lleva la marca', () => {
    render(<RetryQueryError message="No se pudo cargar la caja." onRetry={jest.fn()} />)

    expect(screen.getByTestId('retry-query-error')).toHaveAttribute('data-reintento')
  })

  it('un error sin «Reintentar» y el aviso de respaldo del armazón no la llevan', () => {
    render(
      <>
        <FormMessage tone="error">No se pudo cargar la carta.</FormMessage>
        <RetryQueryError message="Sin conexión." onRetry={jest.fn()} fallback />
      </>,
    )

    expect(screen.getByTestId('retry-query-error')).not.toHaveAttribute('data-reintento')
  })
})
