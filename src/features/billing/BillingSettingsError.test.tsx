import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { invoice, taxSettings } from '#jest/fixtures/panel'
import { ErrorResponse, mountScreen, server, signInAs } from '#jest/harness'
import { BillingView } from './BillingView'

const SETTINGS = '/billing/settings'
const FAILURE = 'Base caída'

describe('BillingView: datos fiscales que no cargan', () => {
  it('lo dice, deja ver lo emitido y al reintentar aparece el botón', async () => {
    const api = server()
      .on('get', SETTINGS, new ErrorResponse(500, FAILURE))
      .on('get', '/billing/invoices', { items: [invoice()], total: 1 })
    signInAs()
    const { user } = mountScreen(<BillingView />)

    expect(await screen.findByText(FAILURE)).toBeInTheDocument()
    expect(await screen.findByText(/B001-12/u)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Datos fiscales/u })).not.toBeInTheDocument()

    api.on('get', SETTINGS, taxSettings())
    await user.click(screen.getByRole('button', { name: /reintentar/iu }))

    expect(await screen.findByRole('button', { name: /Datos fiscales/u })).toBeInTheDocument()
    expect(screen.queryByText(FAILURE)).not.toBeInTheDocument()
  })
})
