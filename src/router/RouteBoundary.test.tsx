import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { StrictMode } from 'react'
import { Link, MemoryRouter, Outlet, Route, Routes } from 'react-router'

import { RouteBoundary } from './RouteBoundary'

// Como en producción: un router declarativo, sin el `ErrorBoundary` que
// `mountRoutes` agrega a cada ruta en las demás pruebas.
const NOTICE = 'Algo salió mal'
const FAILURE = 'la pantalla se rompió'

function Broken(): never {
  throw new Error(FAILURE)
}

function open(en: string) {
  const caught: unknown[] = []
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[en]}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <nav>
                  <Link to="/sana">Ir a la sana</Link>
                  <Link to="/rota">Ir a la rota</Link>
                </nav>
                <RouteBoundary>
                  <Outlet />
                </RouteBoundary>
              </>
            }
          >
            <Route path="sana" element={<p>Pantalla sana</p>} />
            <Route path="rota" element={<Broken />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </StrictMode>,
    {
      onCaughtError: (error: unknown) => {
        caught.push(error)
      },
    },
  )
  return { caught, user: userEvent.setup() }
}

describe('RouteBoundary', () => {
  it('una pantalla que falla muestra el aviso en castellano con «Recargar», no la pila', () => {
    open('/rota')

    expect(screen.getByText(NOTICE)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recargar' })).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(FAILURE, 'u'))).not.toBeInTheDocument()
  })

  it('al navegar a una pantalla rota atrapa (y anota) el error una sola vez', async () => {
    const { caught, user } = open('/sana')

    await user.click(screen.getByRole('link', { name: 'Ir a la rota' }))

    expect(await screen.findByText(NOTICE)).toBeInTheDocument()
    expect(caught).toHaveLength(1)
  })

  it('al ir a otra ruta deja de mostrar el aviso', async () => {
    const { user } = open('/rota')
    expect(screen.getByText(NOTICE)).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Ir a la sana' }))

    expect(await screen.findByText('Pantalla sana')).toBeInTheDocument()
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument()
  })

  it('sin el límite, el error se escapa del router: las pruebas de arriba no pasan de casualidad', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() =>
      render(
        <MemoryRouter initialEntries={['/rota']}>
          <Routes>
            <Route path="/rota" element={<Broken />} />
          </Routes>
        </MemoryRouter>,
      ),
    ).toThrow(FAILURE)
  })
})
