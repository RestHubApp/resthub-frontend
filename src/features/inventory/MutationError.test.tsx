import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { MutationError } from './MutationError'

describe('MutationError', () => {
  it('no muestra nada si no hubo error', () => {
    const { container } = render(<MutationError isError={false} error={null} fallback="Falló." />)

    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el texto de respaldo cuando el error no trae motivo', () => {
    render(<MutationError isError error={new Error('x')} fallback="No se pudo guardar." />)

    expect(screen.getByText('No se pudo guardar.')).toBeInTheDocument()
  })
})
