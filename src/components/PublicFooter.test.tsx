import { describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { mountScreen, server } from '#jest/harness'
import { PublicFooter } from './PublicFooter'

describe('PublicFooter', () => {
  it('lleva la política, los derechos ARCO y el año en curso', () => {
    server()
    mountScreen(<PublicFooter privacyTo="/privacidad" rightsTo="/privacidad#derechos" />, { path: '/acceso' })

    const nav = screen.getByRole('navigation', { name: 'Información legal y accesibilidad' })
    expect(within(nav).getByRole('link', { name: 'Privacidad y términos' })).toHaveAttribute('href', '/privacidad')
    expect(within(nav).getByRole('link', { name: 'Tus derechos (ARCO)' })).toHaveAttribute('href', '/privacidad#derechos')
    expect(screen.getByText(`© ${String(new Date().getFullYear())} RestHub`)).toBeInTheDocument()
  })

  it('abre el menú de accesibilidad con el botón', async () => {
    server()
    const { user } = mountScreen(<PublicFooter privacyTo="/privacidad" rightsTo="/privacidad#derechos" />, { path: '/acceso' })
    // El widget ya dibujó su botón: abrir el menú es hacerle clic.
    const widgetButton = document.createElement('a')
    widgetButton.className = 'asw-menu-btn'
    const onClick = jest.fn()
    widgetButton.addEventListener('click', onClick)
    document.body.append(widgetButton)

    await user.click(screen.getByRole('button', { name: 'Accesibilidad' }))

    expect(onClick).toHaveBeenCalledTimes(1)
    widgetButton.remove()
  })
})
