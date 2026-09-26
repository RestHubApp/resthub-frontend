// El código de vista previa llega en el fragmento de la dirección
// (`/vista-previa#codigo=…`) y no en la consulta: el fragmento no viaja al
// servidor que sirve la aplicación, así que no queda en sus registros.

/** El nombre del dato en el fragmento. Lo arma el área de plataforma. */
export const PREVIEW_CODE_PARAM = 'codigo'
// Un código de verdad es mucho más corto; algo más largo no se manda.
const MAX_CODE_LENGTH = 256
const UNAUTHORIZED = 401
const UNPROCESSABLE = 422

/** El código del fragmento, o `null` si no hay uno que valga la pena canjear. */
export function previewCodeFrom(hash: string): string | null {
  const datos = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const codigo = (datos.get(PREVIEW_CODE_PARAM) ?? '').trim()
  return codigo === '' || codigo.length > MAX_CODE_LENGTH ? null : codigo
}

/** La misma dirección sin el fragmento: lo que queda en la barra y en el historial. */
export function withoutHash(location: { readonly pathname: string; readonly search: string }): string {
  return `${location.pathname}${location.search}`
}

/** Por qué no se pudo abrir la vista previa. */
export type PreviewEntryFailure = 'missing' | 'invalid' | 'offline' | 'failed'

/**
 * El motivo de un canje fallido, según lo que respondió el servidor.
 *
 * Un 401 es un código inválido, vencido o ya usado: el servidor no dice cuál.
 * Sin respuesta, no hubo conexión; y como el código se usa una sola vez, no
 * se reintenta: se pide otro desde la administración.
 */
export function failureOf(status: number | undefined): PreviewEntryFailure {
  if (status === undefined) {
    return 'offline'
  }
  return status === UNAUTHORIZED || status === UNPROCESSABLE ? 'invalid' : 'failed'
}

export const FAILURE_MESSAGES: Readonly<Record<PreviewEntryFailure, string>> = {
  missing: 'Esta dirección no trae un código de vista previa.',
  invalid: 'El código de vista previa no vale: venció (dura un minuto) o ya se usó.',
  offline: 'No hubo conexión con el servidor para abrir la vista previa.',
  failed: 'El servidor no pudo abrir la vista previa.',
}
