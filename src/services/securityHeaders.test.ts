import { describe, expect, it, jest } from '@jest/globals'

// Las cabeceras de seguridad que sirve Vercel (vercel.json) y que la vista
// previa de Vite repite en las E2E.
const { readFileSync } = jest.requireActual<{ readFileSync: (file: string, encoding: 'utf8') => string }>('node:fs')

interface VercelConfig {
  readonly headers: readonly { readonly headers: readonly { readonly key: string; readonly value: string }[] }[]
}

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as VercelConfig
const csp = vercel.headers.flatMap((rule) => rule.headers).find(({ key }) => key === 'Content-Security-Policy')?.value ?? ''
const directives = new Map(
  csp.split(';').map((part) => part.trim()).filter((part) => part !== '').map((part) => {
    const [name = '', ...values] = part.split(/\s+/u)
    return [name, values.join(' ')] as const
  }),
)

describe('Content-Security-Policy de producción', () => {
  it('no deja cambiar la dirección base de la página (base-uri, ASVS V3.4.3)', () => {
    // La aplicación no usa <base>: una etiqueta inyectada no puede redirigir sus rutas relativas.
    expect(directives.get('base-uri')).toBe("'none'")
    expect(readFileSync('index.html', 'utf8')).not.toMatch(/<base\b/iu)
  })

  it('mantiene cerrados los scripts, los objetos y el enmarcado', () => {
    expect(directives.get('script-src')).toBe("'self'")
    expect(directives.get('object-src')).toBe("'none'")
    expect(directives.get('frame-ancestors')).toBe("'none'")
    expect(directives.get('form-action')).toBe("'self'")
  })
})
