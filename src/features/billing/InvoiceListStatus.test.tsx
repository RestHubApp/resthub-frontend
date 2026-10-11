import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { InvoiceListStatus } from './InvoiceListStatus'

const BASE = { isPending: false, isError: false, isEmpty: false, error: null, onRetry: () => undefined }

describe('InvoiceListStatus', () => {
  it('muestra el vacío', () => {
    render(<InvoiceListStatus {...BASE} isEmpty />)
    expect(screen.getByText('Todavía no se emitió ningún comprobante')).toBeInTheDocument()
  })

  it('muestra el error con su reintento', () => {
    render(<InvoiceListStatus {...BASE} isError />)
    expect(screen.getByText('No se pudieron cargar los comprobantes.')).toBeInTheDocument()
  })

  it('no muestra nada si todo está bien', () => {
    const { container } = render(<InvoiceListStatus {...BASE} />)
    expect(container).toBeEmptyDOMElement()
  })
})
