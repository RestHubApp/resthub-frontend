import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { mountPlatform, restaurantCard, signInToPlatform } from '#jest/fixtures/platform'
import { server } from '#jest/harness'

const CARD = '/platform/restaurants/4'
const RESET = '/platform/restaurants/4/owners/30/password'
// Contraseña de prueba, no una credencial real.
const TEMPORARY = 'temporal-segura-1'

describe('contraseña temporal de un encargado desde la plataforma (RFS-04)', () => {
  it('la restablece y marca al encargado con contraseña temporal', async () => {
    // Como el servidor: después del cambio, la ficha trae al encargado con la contraseña temporal.
    const owner = { id: 30, full_name: 'Lucho Ramos', email: 'owner@esquina.pe', is_active: true, must_change_password: false }
    const api = server().on('get', CARD, () => restaurantCard({ owners: [{ ...owner }] }))
    api.on('post', RESET, () => {
      owner.must_change_password = true
      return { ...owner }
    })
    signInToPlatform()
    const { user } = mountPlatform('/plataforma/restaurantes/4')

    await user.click(await screen.findByRole('button', { name: 'Restablecer la contraseña de Lucho Ramos' }))
    const dialog = screen.getByRole('dialog', { name: 'Restablecer la contraseña de Lucho Ramos' })
    await user.type(within(dialog).getByLabelText('Contraseña temporal'), TEMPORARY)
    await user.click(within(dialog).getByRole('button', { name: 'Restablecer' }))

    expect(await screen.findByText('Contraseña temporal')).toBeInTheDocument()
    expect(api.calls('post', RESET)[0]?.body).toEqual({ new_password: TEMPORARY })
  })
})
