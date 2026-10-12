import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { mountScreen, server } from '#jest/harness'
import { PublicFooter } from './PublicFooter'

describe('PublicFooter', () => {
  it('lleva la política, los derechos ARCO y el año en curso, sin repetir el botón de accesibilidad', () => {
    server()
    mountScreen(<PublicFooter privacyTo="/privacidad" rightsTo="/privacidad#derechos" />, { path: '/acceso' })

    const nav = screen.getByRole('navigation', { name: 'Información legal' })
    expect(within(nav).getByRole('link', { name: 'Privacidad y términos' })).toHaveAttribute('href', '/privacidad')
    expect(within(nav).getByRole('link', { name: 'Tus derechos (ARCO)' })).toHaveAttribute('href', '/privacidad#derechos')
    expect(screen.queryByRole('button', { name: 'Accesibilidad' })).not.toBeInTheDocument()
    expect(screen.getByText(`© ${String(new Date().getFullYear())} RestHub`)).toBeInTheDocument()
  })
})
