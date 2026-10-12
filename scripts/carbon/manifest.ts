import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { z } from 'zod'

// El manifest de Vite (`build.manifest`): cada archivo de salida con lo que
// importa de forma estática, lo que importa de forma perezosa y su CSS.
const chunkSchema = z.object({
  file: z.string(),
  src: z.string().optional(),
  isEntry: z.boolean().optional(),
  imports: z.array(z.string()).default([]),
  dynamicImports: z.array(z.string()).default([]),
  css: z.array(z.string()).default([]),
  assets: z.array(z.string()).default([]),
})

export type Chunk = z.infer<typeof chunkSchema>
export type Manifest = Record<string, Chunk>

export function readManifest(dist: string): Manifest {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- la carpeta de la compilación la da quien corre el script
  const raw: unknown = JSON.parse(readFileSync(join(dist, '.vite', 'manifest.json'), 'utf8'))
  return z.record(z.string(), chunkSchema).parse(raw)
}

/** El chunk que nació del módulo `src`; falla si ya no existe (la lista de rutas quedó vieja). */
export function chunkOf(manifest: Manifest, src: string): Chunk {
  const chunk = Object.values(manifest).find((candidate) => candidate.src === src)
  if (chunk === undefined) {
    throw new Error(`El módulo ${src} no está en el manifest: actualiza scripts/carbon/routes.ts.`)
  }
  return chunk
}

/** Los archivos del chunk y los de cada módulo que importa de forma estática: JS y CSS. */
export function filesOf(manifest: Manifest, chunk: Chunk, seen = new Set<string>()): string[] {
  if (seen.has(chunk.file)) {
    return []
  }
  seen.add(chunk.file)
  const nested = chunk.imports.flatMap((key) => {
    const imported = manifest[key]
    return imported === undefined ? [] : filesOf(manifest, imported, seen)
  })
  return [chunk.file, ...chunk.css, ...nested]
}
