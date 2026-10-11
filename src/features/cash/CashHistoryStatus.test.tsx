import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { CashHistoryStatus } from './CashHistoryStatus'

describe('CashHistoryStatus', () => {
  it('muestra el esqueleto mientras carga', () => {
    render(<CashHistoryStatus isPending error={null} isEmpty={false} />)

    expect(screen.getByText('Cargando turnos…')).toBeInTheDocument()
  })

  it('muestra el error de la carga', () => {
    render(<CashHistoryStatus isPending={false} error={new Error('falló')} isEmpty={false} />)

    expect(screen.getByText(/No se pudieron cargar los turnos/u)).toBeInTheDocument()
  })

  it('avisa cuando no hay turnos', () => {
    render(<CashHistoryStatus isPending={false} error={null} isEmpty />)

    expect(screen.getByText('Todavía no hay turnos de caja')).toBeInTheDocument()
  })
})
