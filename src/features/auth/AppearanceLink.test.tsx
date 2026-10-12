import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { mountScreen, PERMISSIONS_WAITER, signInAs } from '#jest/harness'
import { ProfileView } from './ProfileView'

describe('AppearanceLink', () => {
  it('el perfil enlaza a la pantalla de apariencia, también en una vista previa', () => {
    signInAs(PERMISSIONS_WAITER, { preview: true })
    mountScreen(<ProfileView />, { path: '/perfil' })

    expect(screen.getByRole('link', { name: 'Cambiar la apariencia' })).toHaveAttribute('href', '/perfil/apariencia')
  })
})
