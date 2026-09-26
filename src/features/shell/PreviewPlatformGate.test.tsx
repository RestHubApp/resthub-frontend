import { renderToString } from 'react-dom/server'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

function memoria() {
  const datos = new Map<string, string>()
  return {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => {
      datos.set(clave, valor)
    },
    removeItem: (clave: string) => {
      datos.delete(clave)
    },
  }
}

// La pestaña decide al cargarse si es de vista previa: cada prueba parte de módulos nuevos.
async function pantallaDePlataforma(cargadaEn: string): Promise<string> {
  vi.stubGlobal('localStorage', memoria())
  vi.stubGlobal('sessionStorage', memoria())
  vi.stubGlobal('location', { pathname: cargadaEn, search: '', hash: '' })
  vi.resetModules()
  const { default: PreviewPlatformGate } = await import('./PreviewPlatformGate')
  const rutas = [
    { element: <PreviewPlatformGate />, children: [{ path: '/plataforma', element: <p>Área de plataforma</p> }] },
  ]
  const handler = createStaticHandler(rutas)
  const contexto = await handler.query(new Request('http://localhost/plataforma'))
  if (contexto instanceof Response) {
    throw new Error('La ruta no debería redirigir.')
  }
  return renderToString(<StaticRouterProvider router={createStaticRouter(handler.dataRoutes, contexto)} context={contexto} />)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PreviewPlatformGate', () => {
  it('en una pestaña normal deja ver el área de plataforma', async () => {
    const html = await pantallaDePlataforma('/plataforma')
    expect(html).toContain('Área de plataforma')
    expect(html).not.toContain('Estás en una vista previa')
  })

  it('en una pestaña de vista previa muestra el aviso con «Salir de la vista previa»', async () => {
    const html = await pantallaDePlataforma('/vista-previa')
    expect(html).not.toContain('Área de plataforma')
    expect(html).toContain('Estás en una vista previa')
    expect(html).toContain('Sal de la vista previa para usar la administración del sistema.')
    expect(html).toContain('Salir de la vista previa')
  })
})
