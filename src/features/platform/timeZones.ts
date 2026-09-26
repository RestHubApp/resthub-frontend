import { DEFAULT_TIME_ZONE } from '../../services/format'

export interface TimeZoneOption {
  readonly value: string
  readonly label: string
}

/** El largo máximo que acepta el backend. */
export const MAX_TIME_ZONE = 64

/**
 * Las zonas horarias que se ofrecen al dar de alta un restaurante.
 *
 * No son todas las de IANA: son las de los países donde RestHub tiene o
 * puede tener clientes, con Lima primero. El servidor acepta cualquier zona
 * válida; una fuera de esta lista se ve igual en la ficha del restaurante.
 */
export const COMMON_TIME_ZONES: readonly TimeZoneOption[] = [
  { value: DEFAULT_TIME_ZONE, label: 'Lima (Perú)' },
  { value: 'America/Bogota', label: 'Bogotá (Colombia)' },
  { value: 'America/Guayaquil', label: 'Guayaquil (Ecuador)' },
  { value: 'America/La_Paz', label: 'La Paz (Bolivia)' },
  { value: 'America/Santiago', label: 'Santiago (Chile)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (Argentina)' },
  { value: 'America/Montevideo', label: 'Montevideo (Uruguay)' },
  { value: 'America/Asuncion', label: 'Asunción (Paraguay)' },
  { value: 'America/Caracas', label: 'Caracas (Venezuela)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (Brasil)' },
  { value: 'America/Panama', label: 'Panamá' },
  { value: 'America/Costa_Rica', label: 'San José (Costa Rica)' },
  { value: 'America/Guatemala', label: 'Guatemala' },
  { value: 'America/El_Salvador', label: 'San Salvador (El Salvador)' },
  { value: 'America/Tegucigalpa', label: 'Tegucigalpa (Honduras)' },
  { value: 'America/Managua', label: 'Managua (Nicaragua)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México' },
  { value: 'America/Santo_Domingo', label: 'Santo Domingo (República Dominicana)' },
  { value: 'America/Puerto_Rico', label: 'San Juan (Puerto Rico)' },
  { value: 'America/New_York', label: 'Nueva York (EE. UU.)' },
  { value: 'America/Chicago', label: 'Chicago (EE. UU.)' },
  { value: 'America/Denver', label: 'Denver (EE. UU.)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (EE. UU.)' },
  { value: 'Europe/Madrid', label: 'Madrid (España)' },
  { value: 'UTC', label: 'UTC' },
]

/**
 * Si el nombre es una zona horaria que el servidor va a aceptar.
 *
 * La decide `Intl`, que conoce también los alias de IANA (`GMT`, `UCT`,
 * `Zulu`, `EST5EDT`). Dos cosas que `Intl` acepta y el servidor no: la
 * misma zona con otras mayúsculas (el servidor la busca tal cual y en Linux
 * `america/lima` no existe) y un desfase suelto como `+05:00`, que no es una
 * zona de IANA. `Intl` devuelve el nombre con sus mayúsculas canónicas, así
 * que si solo cambian las mayúsculas, se escribió mal.
 */
export function isValidTimeZone(zone: string): boolean {
  if (zone === '' || zone.length > MAX_TIME_ZONE) {
    return false
  }
  let canonica: string
  try {
    canonica = new Intl.DateTimeFormat('es-PE', { timeZone: zone }).resolvedOptions().timeZone
  } catch {
    return false
  }
  const soloMayusculas = canonica !== zone && canonica.toLowerCase() === zone.toLowerCase()
  const desfase = /^[+-]/u.test(canonica)
  return !soloMayusculas && !desfase
}

/**
 * Las opciones de la lista, con la zona actual del restaurante aunque no sea
 * de las comunes: sin ella, la lista mostraría otra y guardar la cambiaría.
 */
export function timeZoneOptions(current?: string): readonly TimeZoneOption[] {
  if (current === undefined || current === '' || COMMON_TIME_ZONES.some((zona) => zona.value === current)) {
    return COMMON_TIME_ZONES
  }
  return [{ value: current, label: current }, ...COMMON_TIME_ZONES]
}

/** «Lima (Perú) · America/Lima»: el nombre para leer y el que guarda el servidor. */
export function timeZoneLabel(option: TimeZoneOption): string {
  return option.label === option.value ? option.value : `${option.label} · ${option.value}`
}
