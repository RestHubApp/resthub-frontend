import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'

import { mountScreen, server } from '#jest/harness'
import { PrivacyView, PRIVACY_VERSION } from './PrivacyView'

const RIGHTS = 'Tus derechos (ARCO)'
const PRIVACY = '/privacidad'

describe('PrivacyView', () => {
  it('se lee sin sesión y cubre lo que pide la Ley N.º 29733', () => {
    server()
    mountScreen(<PrivacyView />, { path: PRIVACY })

    expect(screen.getByRole('heading', { level: 1, name: 'Política de privacidad' })).toBeInTheDocument()
    expect(screen.getByText((text) => text.startsWith(`Versión ${PRIVACY_VERSION}.`))).toBeInTheDocument()
    for (const section of ['Consentimiento', 'Inteligencia artificial y envíos fuera del Perú', RIGHTS]) {
      expect(screen.getByRole('heading', { level: 2, name: section })).toBeInTheDocument()
    }
  })

  it('no abre otro <main>: el armazón ya tiene el suyo', () => {
    server()
    mountScreen(<PrivacyView />, { path: PRIVACY })

    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('article')).toBeInTheDocument()
  })

  it('al abrir con #derechos lleva a esa sección', async () => {
    server()
    const scrollIntoView = jest.spyOn(window.HTMLElement.prototype, 'scrollIntoView')
    mountScreen(<PrivacyView />, { path: PRIVACY, en: `${PRIVACY}#derechos` })

    expect(await screen.findByRole('heading', { level: 2, name: RIGHTS })).toBeInTheDocument()
    expect(scrollIntoView.mock.contexts).toHaveLength(1)
    expect(scrollIntoView.mock.contexts[0]).toHaveAttribute('id', 'derechos')
    scrollIntoView.mockRestore()
  })
})
