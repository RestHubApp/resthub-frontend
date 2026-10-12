// Inventario de la interfaz: cada ruta del router, cada ventana, hoja,
// confirmación, grupo de pestañas y desplegable del código, y las funciones
// de cada pantalla (curadas a mano en `funciones/*.json`).
//
// Las rutas y los overlays se leen del código fuente, así que una pantalla o
// una ventana nueva aparece sola en el inventario y `coverage.spec.ts` falla
// hasta que alguna prueba la recorra. `pnpm e2e:inventory` reescribe
// `e2e/coverage-ui.json` con lo que encuentra.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { defined } from '../support/defined.ts'

export interface Element {
  readonly id: string
  readonly type: 'ruta' | 'dialogo' | 'confirmacion' | 'hoja' | 'pestanas' | 'desplegable' | 'funcion' | 'rol' | 'estado'
  readonly description: string
  readonly origin: string
}

const ROOT = join(import.meta.dirname, '..', '..')
const SRC = join(ROOT, 'src')

function files(folder: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
  return readdirSync(folder).flatMap((name) => {
    const route = join(folder, name)
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    return statSync(route).isDirectory() ? files(route) : [route]
  })
}

function routerRoutes(): Element[] {
  // Cada ruta está una sola vez en `routePatterns`; la comodín (una ruta que
  // no existe lleva al inicio) la arma el router, no el módulo.
  const source = readFileSync(join(SRC, 'services', 'paths.ts'), 'utf8')
  const patterns = /export const routePatterns = \{([^}]*)\}/u.exec(source)?.[1] ?? ''
  const origin = 'src/services/paths.ts'
  const routes = new Map<string, string>()
  for (const match of patterns.matchAll(/: '(\/[^']*)'/gu)) {
    routes.set(defined(match[1]), origin)
  }
  routes.set('/*', 'src/router/routes.tsx')
  return [...routes]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, sourceFile]) => ({
      id: `ruta:${path}`,
      type: 'ruta',
      description: path.endsWith('*') ? 'Una ruta que no existe redirige al inicio' : `Pantalla ${path}`,
      origin: sourceFile,
    }))
}

const OVERLAYS = [
  { label: 'FormDialog', type: 'dialogo' },
  { label: 'SaveFormDialog', type: 'dialogo' },
  { label: 'ConfirmDialog', type: 'confirmacion' },
  { label: 'AlertDialog', type: 'confirmacion' },
  { label: 'Sheet', type: 'hoja' },
  { label: 'DetailSheet', type: 'hoja' },
  { label: 'Tabs', type: 'pestanas' },
] as const

function title(fragment: string): string {
  const literal = /title="([^"]+)"/u.exec(fragment)
  if (literal !== null) {
    return defined(literal[1])
  }
  const expression = /title=\{([^\n]+?)\}\s*(?:\n|>|size|description|open|onOpenChange)/u.exec(fragment)
  if (expression !== null) {
    return defined(expression[1]).trim()
  }
  const sheet = /<SheetTitle[^>]*>([^<]+)<\/SheetTitle>/u.exec(fragment)
  return sheet === null ? '' : defined(sheet[1]).trim()
}

function codeOverlays(): Element[] {
  const items: Element[] = []
  const sources = files(SRC).filter(
    (route) =>
      route.endsWith('.tsx') &&
      !route.endsWith('.test.tsx') &&
      !route.includes(join('components', 'ui')) &&
      // Las envolturas compartidas, no las ventanas que las usan
      // (`TableFormDialog`, `RoleFormDialog`, `CustomerDialog`). `DetailSheet` es
      // la hoja compartida: cada pantalla que la abre cuenta como su propia hoja.
      !route.endsWith(join('components', 'FormDialog.tsx')) &&
      !route.endsWith(join('components', 'SaveFormDialog.tsx')) &&
      !route.endsWith(join('components', 'ConfirmDialog.tsx')) &&
      !route.endsWith(join('components', 'DetailSheet.tsx')),
  )
  for (const route of sources) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    const source = readFileSync(route, 'utf8')
    const file = relative(SRC, route).replaceAll('\\', '/').replace(/^features\//u, '').replace(/\.tsx$/u, '')
    const inFile: Element[] = []
    for (const { label, type } of OVERLAYS) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
      for (const match of source.matchAll(new RegExp(`<${label}(?=[\\s>])`, 'gu'))) {
        const fragment = source.slice(match.index, match.index + 900)
        inFile.push({ id: '', type, description: title(fragment), origin: `src/${relative(SRC, route)}` })
      }
    }
    const expandable = [...source.matchAll(/aria-expanded=|<details[\s>]/gu)].length
    for (let i = 0; i < expandable; i += 1) {
      inFile.push({ id: '', type: 'desplegable', description: 'Sección que se abre y se cierra', origin: `src/${relative(SRC, route)}` })
    }
    for (const [index, element] of inFile.entries()) {
      const repeated = inFile.filter((other) => other.type === element.type).length
      const order = inFile.slice(0, index).filter((other) => other.type === element.type).length + 1
      const suffix = repeated > 1 ? `#${String(order)}` : ''
      items.push({ ...element, id: `${element.type}:${file}${suffix}` })
    }
  }
  return items.sort((a, b) => a.id.localeCompare(b.id))
}

function functionsCurated(): Element[] {
  const folder = join(import.meta.dirname, 'functions')
  return files(folder)
    .filter((route) => route.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b))
    .flatMap((route) => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
      const list = JSON.parse(readFileSync(route, 'utf8')) as { id: string; type?: Element['type']; description: string }[]
      return list.map((row) => ({
        id: row.id,
        type: row.type ?? 'funcion',
        description: row.description,
        origin: `e2e/inventory/functions/${relative(folder, route)}`,
      }))
    })
}

export function inventory(): Element[] {
  return [...routerRoutes(), ...codeOverlays(), ...functionsCurated()]
}

export const FILE_INVENTORY = join(ROOT, 'e2e', 'coverage-ui.json')
