import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { MenuStatus } from './MenuStatus'

describe('MenuStatus', () => {
  it('muestra el esqueleto mientras carga', () => {
    render(<MenuStatus isPending error={null} isEmpty={false} />)

    expect(screen.getByText(/Cargando/u)).toBeInTheDocument()
  })

  it('muestra el error de la carga', () => {
    render(<MenuStatus isPending={false} error={new Error('falló')} isEmpty={false} />)

    expect(screen.getByText(/No se pudo cargar la carta/u)).toBeInTheDocument()
  })

  it('avisa cuando la carta está vacía', () => {
    render(<MenuStatus isPending={false} error={null} isEmpty />)

    expect(screen.getByText('La carta está vacía')).toBeInTheDocument()
  })
})
