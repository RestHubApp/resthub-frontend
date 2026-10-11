// Inventario de la interfaz: cada ruta del router, cada ventana, hoja,
// confirmación, grupo de pestañas y desplegable del código, y las funciones
// de cada pantalla (curadas a mano en `funciones/*.json`).
//
// Las rutas y los overlays se leen del código fuente, así que una pantalla o
// una ventana nueva aparece sola en el inventario y `cobertura.spec.ts` falla
// hasta que alguna prueba la recorra. `pnpm e2e:inventario` reescribe
// `e2e/cobertura-ui.json` con lo que encuentra.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

export interface Element {
  readonly id: string
  readonly tipo: 'ruta' | 'dialogo' | 'confirmacion' | 'hoja' | 'pestanas' | 'desplegable' | 'funcion' | 'rol' | 'estado'
  readonly descripcion: string
  readonly origen: string
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
  // Cada ruta está una sola vez en `routePatterns`; las comodines de cada área
  // (una ruta que no existe lleva al inicio) las arma el router, no el módulo.
  const source = readFileSync(join(SRC, 'services', 'paths.ts'), 'utf8')
  const patterns = /export const routePatterns = \{([^}]*)\}/u.exec(source)?.[1] ?? ''
  const origin = 'src/services/paths.ts'
  const routes = new Map<string, string>()
  for (const match of patterns.matchAll(/: '(\/[^']*)'/gu)) {
    routes.set(match[1], origin)
  }
  routes.set('/*', 'src/router/routes.tsx')
  routes.set('/plataforma/*', 'src/router/routes.tsx')
  return [...routes]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, originValue]) => ({
      id: `ruta:${path}`,
      tipo: 'ruta',
      descripcion: path.endsWith('*') ? 'Una ruta que no existe redirige al inicio' : `Pantalla ${path}`,
      origen: originValue,
    }))
}

const OVERLAYS = [
  { etiqueta: 'FormDialog', tipo: 'dialogo' },
  { etiqueta: 'ConfirmDialog', tipo: 'confirmacion' },
  { etiqueta: 'AlertDialog', tipo: 'confirmacion' },
  { etiqueta: 'Sheet', tipo: 'hoja' },
  { etiqueta: 'Tabs', tipo: 'pestanas' },
] as const

function title(fragment: string): string {
  const literal = /title="([^"]+)"/u.exec(fragment)
  if (literal !== null) {
    return literal[1]
  }
  const expression = /title=\{([^\n]+?)\}\s*(?:\n|>|size|description|open|onOpenChange)/u.exec(fragment)
  if (expression !== null) {
    return expression[1].trim()
  }
  const sheet = /<SheetTitle[^>]*>([^<]+)<\/SheetTitle>/u.exec(fragment)
  return sheet === null ? '' : sheet[1].trim()
}

function codeOverlays(): Element[] {
  const items: Element[] = []
  const sources = files(SRC).filter(
    (route) =>
      route.endsWith('.tsx') &&
      !route.endsWith('.test.tsx') &&
      !route.includes(join('components', 'ui')) &&
      // Las dos envolturas compartidas, no las ventanas que las usan
      // (`TableFormDialog`, `RoleFormDialog`).
      !route.endsWith(join('components', 'FormDialog.tsx')) &&
      !route.endsWith(join('components', 'ConfirmDialog.tsx')),
  )
  for (const route of sources) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    const source = readFileSync(route, 'utf8')
    const file = relative(SRC, route).replace(/\\/gu, '/').replace(/^features\//u, '').replace(/\.tsx$/u, '')
    const inFile: Element[] = []
    for (const { etiqueta: label, tipo: type } of OVERLAYS) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
      for (const match of source.matchAll(new RegExp(`<${label}(?=[\\s>])`, 'gu'))) {
        const fragment = source.slice(match.index, match.index + 900)
        inFile.push({ id: '', tipo: type, descripcion: title(fragment), origen: `src/${relative(SRC, route)}` })
      }
    }
    const expandable = [...source.matchAll(/aria-expanded=|<details[\s>]/gu)].length
    for (let i = 0; i < expandable; i += 1) {
      inFile.push({ id: '', tipo: 'desplegable', descripcion: 'Sección que se abre y se cierra', origen: `src/${relative(SRC, route)}` })
    }
    inFile.forEach((element, index) => {
      const repeated = inFile.filter((other) => other.tipo === element.tipo).length
      const order = inFile.slice(0, index).filter((other) => other.tipo === element.tipo).length + 1
      const suffix = repeated > 1 ? `#${String(order)}` : ''
      items.push({ ...element, id: `${element.tipo}:${file}${suffix}` })
    })
  }
  return items.sort((a, b) => a.id.localeCompare(b.id))
}

function functionsCurated(): Element[] {
  const folder = join(import.meta.dirname, 'funciones')
  return files(folder)
    .filter((route) => route.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b))
    .flatMap((route) => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
      const list = JSON.parse(readFileSync(route, 'utf8')) as { id: string; tipo?: Element['tipo']; descripcion: string }[]
      return list.map((row) => ({
        id: row.id,
        tipo: row.tipo ?? 'funcion',
        descripcion: row.descripcion,
        origen: `e2e/inventario/funciones/${relative(folder, route)}`,
      }))
    })
}

export function inventory(): Element[] {
  return [...routerRoutes(), ...codeOverlays(), ...functionsCurated()]
}

export const FILE_INVENTORY = join(ROOT, 'e2e', 'cobertura-ui.json')
