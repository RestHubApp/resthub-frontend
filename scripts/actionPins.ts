// Que cada acción de GitHub esté fijada al mismo commit en todos los
// workflows (.github/workflows) y acciones compuestas (.github/actions). Las
// actualizaciones de Dependabot llegan juntas; si una acción quedó en otra
// versión en algún archivo, falla y dice dónde.
//
// Uso:  pnpm check:actions
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ROOTS = ['.github/workflows', '.github/actions']
const USES = /uses: ([\w./-]+)@([0-9a-f]{40})/gu

function yamlFiles(directory: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- las carpetas son las constantes de arriba
  return readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.ya?ml$/u.test(file))
    .map((file) => path.join(directory, file))
}

/** Por cada acción, los commits a los que está fijada y en qué archivos. */
function pinsByAction(files: readonly string[]): Map<string, Map<string, Set<string>>> {
  const pins = new Map<string, Map<string, Set<string>>>()
  for (const file of files) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- los archivos salen de listar esas carpetas
    for (const [, action = '', sha = ''] of readFileSync(file, 'utf8').matchAll(USES)) {
      const bySha = pins.get(action) ?? new Map<string, Set<string>>()
      bySha.set(sha, (bySha.get(sha) ?? new Set<string>()).add(file))
      pins.set(action, bySha)
    }
  }
  return pins
}

const mismatches = [...pinsByAction(ROOTS.flatMap(yamlFiles))].filter(([, bySha]) => bySha.size > 1)
for (const [action, bySha] of mismatches) {
  console.error(`${action} está fijada a ${String(bySha.size)} commits distintos:`)
  for (const [sha, files] of bySha) console.error(`  ${sha}  ${[...files].join(', ')}`)
}
if (mismatches.length > 0) process.exit(1)
console.warn('Cada acción está fijada al mismo commit en todos los workflows.')
