/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Simula una pestaña sin DOM (location, window y almacenamiento de prueba),
// como corría con Vitest: en jsdom, `window.location` no se puede reemplazar.
import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { stubGlobal, unstubAllGlobals } from '#jest/globals'

function memory() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
  }
}

// La pestaña decide al cargarse si es de vista previa: cada prueba parte de módulos nuevos.
async function platformScreen(loadedIn: string): Promise<string> {
  stubGlobal('localStorage', memory())
  stubGlobal('sessionStorage', memory())
  stubGlobal('location', { pathname: loadedIn, search: '', hash: '' })
  jest.resetModules()
  // React, el router y el renderizador salen del mismo registro de módulos que
  // el componente: con dos copias de React, los hooks no encuentran su contexto.
  const { renderToString: toHtml } = await import('react-dom/server')
  const { createStaticHandler, createStaticRouter, StaticRouterProvider } = await import('react-router')
  const { PreviewPlatformGate } = await import('./PreviewPlatformGate')
  const routes = [
    { element: <PreviewPlatformGate />, children: [{ path: '/plataforma', element: <p>Área de plataforma</p> }] },
  ]
  const handler = createStaticHandler(routes)
  const context = await handler.query(new Request('http://localhost/plataforma'))
  if (context instanceof Response) {
    throw new Error('La ruta no debería redirigir.')
  }
  return toHtml(<StaticRouterProvider router={createStaticRouter(handler.dataRoutes, context)} context={context} />)
}

afterEach(() => {
  unstubAllGlobals()
})

describe('PreviewPlatformGate', () => {
  it('en una pestaña normal deja ver el área de plataforma', async () => {
    const html = await platformScreen('/plataforma')
    expect(html).toContain('Área de plataforma')
    expect(html).not.toContain('Estás en una vista previa')
  })

  it('en una pestaña de vista previa muestra el aviso con «Salir de la vista previa»', async () => {
    const html = await platformScreen('/vista-previa')
    expect(html).not.toContain('Área de plataforma')
    expect(html).toContain('Estás en una vista previa')
    expect(html).toContain('Sal de la vista previa para usar la administración del sistema.')
    expect(html).toContain('Salir de la vista previa')
  })
})
