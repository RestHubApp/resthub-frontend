import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { customer } from '#jest/fixtures/panel'
import { signInAs, mountScreen, PERMISSIONS_WAITER, server } from '#jest/harness'
import { CustomersView } from './CustomersView'

const ROSA = '/customers/11'
const OLD = customer({ consent_at: null, consent_version: null })
const REGISTER = { name: 'Registrar consentimiento' }

async function openCard(permissions?: Parameters<typeof signInAs>[0]) {
  const api = server().on('get', '/customers', { items: [OLD], total: 1 }).on('get', ROSA, OLD)
  signInAs(permissions)
  const { user } = mountScreen(<CustomersView />)
  await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))
  const card = await screen.findByRole('dialog', { name: 'Rosa Quispe' })
  await within(card).findByText('Sin consentimiento registrado')
  return { api, user, card }
}

describe('CustomerConsentRequest (RFP-02)', () => {
  it('la ficha de un cliente antiguo pide el consentimiento y muestra lo que guardó el servidor', async () => {
    const { api, user, card } = await openCard()
    const saved = customer({ consent_at: '2026-10-17T15:00:00Z', consent_version: '2026-10' })
    api.on('put', ROSA, saved).on('get', ROSA, saved)

    await user.click(within(card).getByRole('checkbox'))
    await user.click(within(card).getByRole('button', REGISTER))

    await waitFor(() => {
      expect(within(card).queryByText('Sin consentimiento registrado')).not.toBeInTheDocument()
    })
    expect(within(card).queryByRole('button', REGISTER)).not.toBeInTheDocument()
    expect(api.calls('put', ROSA)).toHaveLength(1)
    expect(api.calls('put', ROSA)[0]?.body).toEqual({
      name: 'Rosa Quispe',
      phone: '987654321',
      email: '',
      address: 'Jr. Unión 450',
      reference: 'Frente al parque',
      notes: '',
      consent: true,
    })
  })

  it('sin marcar la casilla no guarda nada', async () => {
    const { api, user, card } = await openCard()

    await user.click(within(card).getByRole('button', REGISTER))

    expect(within(card).getByText('Marca la casilla solo si el cliente acepta.')).toBeInTheDocument()
    expect(api.calls('put', ROSA)).toHaveLength(0)
  })

  it('quien no puede editar clientes ve la insignia, no la casilla', async () => {
    const { card } = await openCard(PERMISSIONS_WAITER)

    expect(within(card).queryByRole('checkbox')).not.toBeInTheDocument()
    expect(within(card).queryByRole('button', REGISTER)).not.toBeInTheDocument()
  })
})
