import type { Session } from '@/api/types'
import { type Appearance, DEFAULT_APPEARANCE, parseAppearance, serializeAppearance } from './appearanceRules'
import { tabStorage } from './tabStorage'

// Las preferencias de apariencia se guardan en este celular o computadora, una por cuenta, en el
// mismo almacenamiento que la pestaña usa para su sesión (`tabStorage`):
// `localStorage` en una pestaña normal y `sessionStorage` en una de vista previa,
// que no deja nada en el navegador. No viajan al servidor.
//
// La clave lleva el tipo y el id de la cuenta: dos personas que comparten el
// celular tienen cada una la suya, y la administración del sistema no se pisa
// con el personal de un local.

// La clave conserva el «v1» aunque la forma guardada sea la 2: así lo que ya eligió la gente se lee y se convierte.
const KEY_PREFIX = 'resthub.appearance.v1'

/** La clave de la cuenta: `resthub.appearance.v1.staff.12`. */
export function appearanceKey(account: Session): string {
  const id = account.kind === 'platform' ? account.admin.id : account.user.id
  return `${KEY_PREFIX}.${account.kind}.${String(id)}`
}

/** Lo guardado para esa clave; sin almacenamiento, o con algo roto, lo de fábrica. */
export function readAppearance(key: string): Appearance {
  try {
    return parseAppearance(tabStorage.storage?.getItem(key) ?? null)
  } catch {
    return DEFAULT_APPEARANCE
  }
}

/** Guarda las preferencias. Sin almacenamiento valen mientras la pestaña siga abierta. */
export function writeAppearance(key: string, appearance: Appearance): void {
  try {
    tabStorage.storage?.setItem(key, serializeAppearance(appearance))
  } catch {
    // Almacenamiento lleno o bloqueado: los cambios no sobreviven a recargar, y es un mal menor.
  }
}
