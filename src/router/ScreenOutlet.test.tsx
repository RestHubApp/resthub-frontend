import { describe, expect, it } from '@jest/globals'
import { act, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { type ComponentType, StrictMode } from 'react'
import { Link, MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router'

import { lazyScreen } from './lazyRoute'
import { ScreenOutlet } from './ScreenOutlet'

const LOADING = 'Cargando…'

/** La pantalla que llega en cada archivo: dice en qué ruta está. */
function Page() {
  return <p>Pantalla {useLocation().pathname}</p>
}

/** El archivo de una pantalla, que llega cuando la prueba lo dice. */
function chunk() {
  const pending: { resolve?: (module: { default: ComponentType }) => void } = {}
  const promise = new Promise<{ default: ComponentType }>((resolve) => {
    pending.resolve = resolve
  })
  return {
    load: () => promise,
    arrives: () =>
      act(async () => {
        pending.resolve?.({ default: Page })
        await promise
      }),
  }
}

// Como `routes.tsx`: una pantalla pública suelta y otra detrás de una guarda,
// las dos bajo el mismo `ScreenOutlet`.
function open(en: string) {
  const publicScreen = chunk()
  const protectedScreen = chunk()
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[en]}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Link to="/protegida">Ir a la protegida</Link>
                <ScreenOutlet />
              </>
            }
          >
            <Route index element={<p>Inicio</p>} />
            <Route path="publica" element={lazyScreen(publicScreen.load)} />
            <Route element={<Outlet />}>
              <Route path="protegida" element={lazyScreen(protectedScreen.load)} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </StrictMode>,
  )
  return { publicScreen, protectedScreen, user: userEvent.setup() }
}

describe('ScreenOutlet', () => {
  it('al abrir la aplicación directo en una pantalla, «Cargando…» hasta que llega su archivo', async () => {
    const { publicScreen } = open('/publica')
    expect(screen.getByText(LOADING)).toBeInTheDocument()

    await publicScreen.arrives()

    expect(screen.getByText('Pantalla /publica')).toBeInTheDocument()
  })

  it.each([
    ['/publica', 'Pantalla /publica'],
    ['/', 'Inicio'],
  ])('de %s a una pantalla protegida, la anterior sigue a la vista mientras baja', async (from, before) => {
    const { publicScreen, protectedScreen, user } = open(from)
    await publicScreen.arrives()
    expect(screen.getByText(before)).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Ir a la protegida' }))

    expect(screen.queryByText(LOADING)).not.toBeInTheDocument()
    expect(screen.getByText(before)).toBeInTheDocument()

    await protectedScreen.arrives()

    expect(screen.getByText('Pantalla /protegida')).toBeInTheDocument()
  })
})
