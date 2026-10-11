import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { mountScreen, server } from '#jest/harness'
import { PrivacyView, PRIVACY_VERSION } from './PrivacyView'

describe('PrivacyView', () => {
  it('se lee sin sesión y cubre lo que pide la Ley N.º 29733', () => {
    server()
    mountScreen(<PrivacyView />, { path: '/privacidad' })

    expect(screen.getByRole('heading', { level: 1, name: 'Términos de uso y política de privacidad' })).toBeInTheDocument()
    expect(screen.getByText((text) => text.startsWith(`Versión ${PRIVACY_VERSION}.`))).toBeInTheDocument()
    for (const section of ['Consentimiento', 'Inteligencia artificial y envíos fuera del Perú', 'Tus derechos (ARCO)']) {
      expect(screen.getByRole('heading', { level: 2, name: section })).toBeInTheDocument()
    }
  })

  it('no abre otro <main>: el armazón ya tiene el suyo', () => {
    server()
    mountScreen(<PrivacyView />, { path: '/privacidad' })

    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('article')).toBeInTheDocument()
  })
})
