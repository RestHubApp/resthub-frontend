import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'

import { mountRoutes } from '#jest/harness'
import { RouteError } from './RouteError'

function Broken(): never {
  throw new Error('falla de prueba')
}

describe('RouteError', () => {
  it('muestra un aviso en español en vez de la pantalla genérica del router', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    mountRoutes([{ path: '/', Component: Broken, ErrorBoundary: RouteError }])

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recargar' })).toBeInTheDocument()
    consoleError.mockRestore()
  })
})
