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

export interface Elemento {
  readonly id: string
  readonly tipo: 'ruta' | 'dialogo' | 'confirmacion' | 'hoja' | 'pestanas' | 'desplegable' | 'funcion' | 'rol' | 'estado'
  readonly descripcion: string
  readonly origen: string
}

const RAIZ = join(import.meta.dirname, '..', '..')
const SRC = join(RAIZ, 'src')

function archivos(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre)
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta]
  })
}

function rutasDelRouter(): Elemento[] {
  const fuente = readFileSync(join(SRC, 'router', 'index.tsx'), 'utf8')
  const inicioPlataforma = fuente.indexOf('const PLATAFORMA')
  const finPlataforma = fuente.indexOf('const VISTA_PREVIA')
  const rutas = new Map<string, string>()
  for (const coincidencia of fuente.matchAll(/path: '([^']+)'/gu)) {
    const camino = coincidencia[1]
    const posicion = coincidencia.index
    const dePlataforma = posicion > inicioPlataforma && posicion < finPlataforma
    let completa: string
    if (camino.startsWith('/')) {
      completa = camino
    } else if (dePlataforma) {
      completa = camino === '*' ? '/plataforma/*' : `/plataforma/${camino}`
    } else {
      completa = `/${camino}`
    }
    rutas.set(completa, 'src/router/index.tsx')
  }
  // Las rutas índice no llevan `path`: el inicio de cada armazón.
  rutas.set('/', 'src/router/index.tsx (index: HomeRedirect)')
  rutas.set('/plataforma', 'src/router/index.tsx (index: RestaurantsView)')
  return [...rutas]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([camino, origen]) => ({
      id: `ruta:${camino}`,
      tipo: 'ruta',
      descripcion: camino.endsWith('*') ? 'Una ruta que no existe redirige al inicio' : `Pantalla ${camino}`,
      origen,
    }))
}

const OVERLAYS = [
  { etiqueta: 'FormDialog', tipo: 'dialogo' },
  { etiqueta: 'ConfirmDialog', tipo: 'confirmacion' },
  { etiqueta: 'Sheet', tipo: 'hoja' },
  { etiqueta: 'Tabs', tipo: 'pestanas' },
] as const

function titulo(fragmento: string): string {
  const literal = /title="([^"]+)"/u.exec(fragmento)
  if (literal !== null) {
    return literal[1]
  }
  const expresion = /title=\{([^\n]+?)\}\s*(?:\n|>|size|description|open|onOpenChange)/u.exec(fragmento)
  if (expresion !== null) {
    return expresion[1].trim()
  }
  const hoja = /<SheetTitle[^>]*>([^<]+)<\/SheetTitle>/u.exec(fragmento)
  return hoja === null ? '' : hoja[1].trim()
}

function overlaysDelCodigo(): Elemento[] {
  const elementos: Elemento[] = []
  const fuentes = archivos(SRC).filter(
    (ruta) =>
      ruta.endsWith('.tsx') &&
      !ruta.endsWith('.test.tsx') &&
      !ruta.includes(join('components', 'ui')) &&
      // Las dos envolturas compartidas, no las ventanas que las usan
      // (`TableFormDialog`, `RoleFormDialog`).
      !ruta.endsWith(join('components', 'FormDialog.tsx')) &&
      !ruta.endsWith(join('components', 'ConfirmDialog.tsx')),
  )
  for (const ruta of fuentes) {
    const fuente = readFileSync(ruta, 'utf8')
    const archivo = relative(SRC, ruta).replace(/\\/gu, '/').replace(/^features\//u, '').replace(/\.tsx$/u, '')
    const enArchivo: Elemento[] = []
    for (const { etiqueta, tipo } of OVERLAYS) {
      for (const coincidencia of fuente.matchAll(new RegExp(`<${etiqueta}(?=[\\s>])`, 'gu'))) {
        const fragmento = fuente.slice(coincidencia.index, coincidencia.index + 900)
        enArchivo.push({ id: '', tipo, descripcion: titulo(fragmento), origen: `src/${relative(SRC, ruta)}` })
      }
    }
    const desplegables = [...fuente.matchAll(/aria-expanded=|<details[\s>]/gu)].length
    for (let i = 0; i < desplegables; i += 1) {
      enArchivo.push({ id: '', tipo: 'desplegable', descripcion: 'Sección que se abre y se cierra', origen: `src/${relative(SRC, ruta)}` })
    }
    enArchivo.forEach((elemento, indice) => {
      const repetidos = enArchivo.filter((otro) => otro.tipo === elemento.tipo).length
      const orden = enArchivo.slice(0, indice).filter((otro) => otro.tipo === elemento.tipo).length + 1
      const sufijo = repetidos > 1 ? `#${String(orden)}` : ''
      elementos.push({ ...elemento, id: `${elemento.tipo}:${archivo}${sufijo}` })
    })
  }
  return elementos.sort((a, b) => a.id.localeCompare(b.id))
}

function funcionesCuradas(): Elemento[] {
  const carpeta = join(import.meta.dirname, 'funciones')
  return archivos(carpeta)
    .filter((ruta) => ruta.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b))
    .flatMap((ruta) => {
      const lista = JSON.parse(readFileSync(ruta, 'utf8')) as { id: string; tipo?: Elemento['tipo']; descripcion: string }[]
      return lista.map((fila) => ({
        id: fila.id,
        tipo: fila.tipo ?? 'funcion',
        descripcion: fila.descripcion,
        origen: `e2e/inventario/funciones/${relative(carpeta, ruta)}`,
      }))
    })
}

export function inventario(): Elemento[] {
  return [...rutasDelRouter(), ...overlaysDelCodigo(), ...funcionesCuradas()]
}

export const ARCHIVO_INVENTARIO = join(RAIZ, 'e2e', 'cobertura-ui.json')
