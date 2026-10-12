import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { FormMessage } from './FormMessage'

describe('FormMessage', () => {
  it('un error interrumpe al lector de pantalla y lleva la marca de falla', () => {
    render(<FormMessage tone="error">No se pudo guardar.</FormMessage>)

    expect(screen.getByRole('alert')).toHaveAttribute('data-falla', 'propia')
  })

  it.each(['ok', 'warning', 'info'] as const)('el tono %s espera turno y no es una falla', (tone) => {
    render(<FormMessage tone={tone}>Aviso</FormMessage>)

    expect(screen.getByRole('status')).not.toHaveAttribute('data-falla')
  })

  it('un aviso con icono conserva el texto y puede anunciarse como alerta', () => {
    render(<FormMessage tone="warning" icon="alert" role="alert">La caja está cerrada.</FormMessage>)

    expect(screen.getByRole('alert')).toHaveTextContent('La caja está cerrada.')
  })
})
