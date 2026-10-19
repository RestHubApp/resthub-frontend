import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { taxSettings } from '#jest/fixtures/panel'
import { mountScreen, server, signInAs } from '#jest/harness'
import { BillingView } from './BillingView'

const SETTINGS = '/billing/settings'

describe('BillingView: régimen tributario', () => {
  it('muestra el régimen guardado y lo cambia a Nuevo RUS al guardar', async () => {
    const api = server().on('get', SETTINGS, taxSettings()).on('get', '/billing/invoices', { items: [], total: 0 })
    api.on('put', SETTINGS, taxSettings({ tax_regime: 'new_rus', allows_tax_invoice: false }))
    signInAs()
    const { user } = mountScreen(<BillingView />)
    await user.click(await screen.findByRole('button', { name: /Datos fiscales/u }))
    const regime = await screen.findByLabelText('Régimen tributario')

    expect(regime).toHaveValue('general')
    await user.selectOptions(regime, 'new_rus')
    await user.click(screen.getByRole('button', { name: 'Guardar datos fiscales' }))

    expect(await screen.findByText('Datos fiscales guardados.')).toBeInTheDocument()
    expect(api.calls('put', SETTINGS)[0]?.body).toMatchObject({ tax_regime: 'new_rus' })
  })
})
