// Tipos de `cn-tables.mjs`, que genera `cn build` en JavaScript (su salida en
// TypeScript no pasa el modo estricto).
import type { createCn } from 'cn/engine'

declare const tables: Parameters<typeof createCn>[0]
export default tables
