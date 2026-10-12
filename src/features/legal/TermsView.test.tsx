import { describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { mountScreen, server } from '#jest/harness'
import { TermsView, TERMS_VERSION } from './TermsView'

const TERMS = '/terminos'

describe('TermsView', () => {
  it('se lee sin sesión, con su versión y las doce secciones', () => {
    server()
    mountScreen(<TermsView />, { path: TERMS })

    expect(screen.getByRole('heading', { level: 1, name: 'Términos y condiciones del servicio' })).toBeInTheDocument()
    expect(screen.getByText(`Versión ${TERMS_VERSION}.`)).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(12)
    expect(screen.getByRole('heading', { level: 2, name: '8. Limitación de responsabilidad' })).toBeInTheDocument()
  })

  it('el índice enlaza cada sección con un ancla estable', () => {
    server()
    mountScreen(<TermsView />, { path: TERMS })

    const index = screen.getByRole('navigation', { name: 'Índice de secciones' })
    expect(within(index).getAllByRole('link')).toHaveLength(12)
    expect(within(index).getByRole('link', { name: 'Cuentas y acceso' })).toHaveAttribute('href', '/terminos#cuentas')
  })

  it('deja a la vista los datos del titular que faltan por completar', () => {
    server()
    mountScreen(<TermsView />, { path: TERMS })

    expect(screen.getByText(/\[Razón social y RUC del titular\]/u)).toBeInTheDocument()
    expect(screen.getByText(/\[Correo de contacto\]/u)).toBeInTheDocument()
    expect(screen.getByText(/\[Ciudad\]/u)).toBeInTheDocument()
  })

  it('al abrir con #contacto lleva a esa sección', async () => {
    server()
    const scrollIntoView = jest.spyOn(window.HTMLElement.prototype, 'scrollIntoView')
    mountScreen(<TermsView />, { path: TERMS, en: `${TERMS}#contacto` })

    expect(await screen.findByRole('heading', { level: 2, name: '12. Contacto' })).toBeInTheDocument()
    expect(scrollIntoView.mock.contexts[0]).toHaveAttribute('id', 'contacto')
    scrollIntoView.mockRestore()
  })
})
