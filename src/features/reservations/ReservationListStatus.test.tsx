import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { ReservationListStatus } from './ReservationListStatus'

const BASE = { isPending: false, isError: false, isEmpty: false, error: null, onRetry: () => undefined }

describe('ReservationListStatus', () => {
  it('muestra el vacío del día', () => {
    render(<ReservationListStatus {...BASE} isEmpty />)
    expect(screen.getByText('No hay reservas para este día')).toBeInTheDocument()
  })

  it('muestra el error de carga', () => {
    render(<ReservationListStatus {...BASE} isError />)
    expect(screen.getByText('No se pudieron cargar las reservas.')).toBeInTheDocument()
  })
})
