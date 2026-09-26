import { appUrl } from '../../services/leaveTab'

// El nombre del dato en el fragmento. Lo lee `/vista-previa` (`features/auth`).
const PARAMETRO = 'codigo'

/**
 * La dirección de la pestaña de vista previa para un código.
 *
 * El código va en el fragmento (`#codigo=…`) y no en la consulta: el
 * fragmento no viaja al servidor que sirve la aplicación, así que no queda en
 * sus registros de acceso.
 */
export function previewUrl(code: string, base?: string): string {
  return `${appUrl('/vista-previa', base)}#${PARAMETRO}=${encodeURIComponent(code)}`
}

/**
 * Abre la vista previa en una pestaña nueva, sin `opener`: la pestaña no
 * puede tocar esta ni hereda su `sessionStorage`.
 *
 * Con `noopener` el navegador no devuelve la pestaña abierta, así que no hay
 * forma de saber si la bloqueó: quien llama muestra además un enlace.
 */
export function openPreviewTab(url: string): void {
  window.open(url, '_blank', 'noopener')
}

/** Cómo se nombra cada vista previa en los botones y avisos. */
export const PREVIEW_AS_LABELS = {
  owner: 'encargado',
  waiter: 'mesero',
} as const
