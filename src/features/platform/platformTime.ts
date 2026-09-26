import { DEFAULT_TIME_ZONE } from '../../services/format'

/**
 * La zona de las horas del área de plataforma.
 *
 * Quien administra no pertenece a ningún restaurante, así que no hay «hora
 * del local»: las altas y la bitácora se leen en la hora de Lima, donde
 * trabaja el equipo de RestHub.
 */
export const PLATFORM_TIME_ZONE = DEFAULT_TIME_ZONE
