import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { TableListStatus } from './TableListStatus'

const BASE = { isPending: false, isError: false, isEmpty: false, error: null, onRetry: () => undefined }

describe('TableListStatus', () => {
  it('muestra el vacío con su ayuda', () => {
    render(<TableListStatus {...BASE} isEmpty />)
    expect(screen.getByText('Todavía no hay mesas')).toBeInTheDocument()
  })

  it('muestra el error de carga', () => {
    render(<TableListStatus {...BASE} isError />)
    expect(screen.getByText('No se pudieron cargar las mesas.')).toBeInTheDocument()
  })
})
