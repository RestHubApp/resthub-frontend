import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { CustomerListStatus } from './CustomerListStatus'

const BASE = { isPending: false, isError: false, isEmpty: false, error: null, emptyTitle: 'Nadie', onRetry: () => undefined }

describe('CustomerListStatus', () => {
  it('muestra el texto del vacío', () => {
    render(<CustomerListStatus {...BASE} isEmpty />)
    expect(screen.getByText('Nadie')).toBeInTheDocument()
  })

  it('muestra el error', () => {
    render(<CustomerListStatus {...BASE} isError />)
    expect(screen.getByText('No se pudieron cargar los clientes.')).toBeInTheDocument()
  })
})
