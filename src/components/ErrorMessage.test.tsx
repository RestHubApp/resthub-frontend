import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { ErrorMessage } from './ErrorMessage'

describe('ErrorMessage', () => {
  it('no muestra nada si no hubo error', () => {
    const { container } = render(<ErrorMessage isError={false} error={null} fallback="Falló." />)

    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el texto de respaldo cuando el error no trae motivo', () => {
    render(<ErrorMessage isError error={new Error('x')} fallback="No se pudo guardar." />)

    expect(screen.getByText('No se pudo guardar.')).toBeInTheDocument()
  })
})

describe('ErrorMessage como aviso de respaldo', () => {
  it('marca la falla como propia, o como de respaldo si es el aviso del armazón', () => {
    const { rerender } = render(<ErrorMessage error={null} fallback="Falló." />)
    expect(screen.getByRole('alert')).toHaveAttribute('data-falla', 'propia')

    rerender(<ErrorMessage error={null} fallback="Falló." isFallbackNotice />)
    expect(screen.getByRole('alert')).toHaveAttribute('data-falla', 'respaldo')
  })
})
