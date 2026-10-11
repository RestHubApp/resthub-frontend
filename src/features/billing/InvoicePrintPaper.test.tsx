import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { invoice } from '#jest/fixtures/panel'
import { InvoicePrintPaper } from './InvoicePrintPaper'

describe('InvoicePrintPaper', () => {
  it('lleva el título accesible y el botón de imprimir', () => {
    render(<InvoicePrintPaper invoice={invoice({ code: 'B001-1' })} settings={null} timeZone="America/Lima" />)
    expect(screen.getByRole('heading', { name: 'Comprobante B001-1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeInTheDocument()
  })
})
