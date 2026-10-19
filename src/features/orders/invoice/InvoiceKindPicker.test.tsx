import { describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { mountScreen, server, signInAs } from '#jest/harness'
import { InvoiceKindPicker } from './InvoiceKindPicker'

describe('tipo de comprobante', () => {
  it('marca el tipo elegido y avisa al cambiar', async () => {
    const onChange = jest.fn()
    const { user } = mountScreen(<InvoiceKindPicker kind="boleta" onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'Boleta' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Factura' }))

    expect(onChange).toHaveBeenCalledWith('factura')
  })

  it('con el régimen en Nuevo RUS no ofrece la factura y lo explica', async () => {
    server().on('get', '/billing/capabilities', { email_enabled: false, email_max_per_hour: 20, archive_enabled: false, tax_invoice_enabled: false })
    signInAs()
    const onChange = jest.fn()
    const { user } = mountScreen(<InvoiceKindPicker kind="boleta" onChange={onChange} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Factura' })).toBeDisabled()
    })
    await user.click(screen.getByRole('button', { name: 'Factura' }))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('El régimen tributario del local solo permite boletas.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Boleta' })).toBeEnabled()
  })

  it('con otro régimen la factura se puede elegir', async () => {
    server().on('get', '/billing/capabilities', { email_enabled: false, email_max_per_hour: 20, archive_enabled: false, tax_invoice_enabled: true })
    signInAs()
    mountScreen(<InvoiceKindPicker kind="boleta" onChange={jest.fn()} />)

    expect(await screen.findByRole('button', { name: 'Factura' })).toBeEnabled()
    expect(screen.queryByText(/solo permite boletas/u)).not.toBeInTheDocument()
  })
})
