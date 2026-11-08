import { afterEach, describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { StrictMode } from 'react'

import { mswServer } from '#jest/mswServer'

const exchanges: unknown[] = []

function previewServerAccepts() {
  mswServer.use(
    http.post('*/api/v1/auth/preview', async ({ request }) => {
      exchanges.push(await request.json())
      return HttpResponse.json({
        access_token: 'token-de-vista-previa',
        expires_in: 1800,
        token_type: 'bearer',
        kind: 'staff',
        user: { id: 7, email: 'ana@resthub.dev', full_name: 'Ana Torres', role_id: 2, role_label: 'Mesero' },
        restaurant: { id: 1, name: 'Local de muestra', slug: 'muestra', timezone: 'America/Lima' },
        permissions: [],
        preview: true,
      })
    }),
  )
}

afterEach(() => {
  exchanges.length = 0
  window.history.replaceState(null, '', '/')
})

describe('PREVIEW (ruta de canje)', () => {
  it('en modo estricto canjea el código una sola vez y entra al inicio con la sesión de vista previa', async () => {
    // La pestaña se cargó en la ruta de canje: `tabStorage` lo decide al importarse.
    window.history.replaceState(null, '', '/vista-previa#codigo=abc')
    const { BrowserRouter, Route, Routes } = await import('react-router')
    const { PREVIEW } = await import('./previewRoute')
    previewServerAccepts()

    render(
      <StrictMode>
        <BrowserRouter>
          <Routes>
            <Route path={PREVIEW.path} element={PREVIEW.element} />
            <Route path="/" element={<p>Inicio</p>} />
          </Routes>
        </BrowserRouter>
      </StrictMode>,
    )

    expect(screen.getByText('Abriendo la vista previa…')).toBeInTheDocument()
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
    expect(exchanges).toEqual([{ code: 'abc' }])
    // La sesión de vista previa vive solo en esta pestaña.
    expect(JSON.stringify(Object.entries(sessionStorage))).toContain('token-de-vista-previa')
    expect(window.location.hash).toBe('')
  })
})
