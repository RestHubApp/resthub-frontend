import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { invoice, taxSettings } from '#jest/fixtures/panel'
import { mountScreen, server, signInAs } from '#jest/harness'
import { BillingView } from './BillingView'

describe('BillingView: quien solo revisa los comprobantes', () => {
  it('no ofrece descargar ni imprimir, pero sí reenviar', async () => {
    server()
      .on('get', '/billing/settings', taxSettings())
      .on('get', '/billing/invoices', { items: [invoice({ status: 'pending', status_label: 'Sin enviar' })], total: 1 })
    signInAs(['billing.manage'])
    mountScreen(<BillingView />)

    expect(await screen.findByRole('button', { name: 'Reenviar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Descargar PDF/u })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Imprimir' })).not.toBeInTheDocument()
  })

  it('quien emite sí puede descargar e imprimir', async () => {
    server()
      .on('get', '/billing/settings', taxSettings())
      .on('get', '/billing/invoices', { items: [invoice()], total: 1 })
    signInAs(['billing.manage', 'billing.issue'])
    mountScreen(<BillingView />)

    expect(await screen.findByRole('link', { name: 'Imprimir' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Descargar PDF/u })).toBeInTheDocument()
  })
})
