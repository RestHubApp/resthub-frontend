import { z } from 'zod'

import type { Reservation, ReservationRequest, ReservationStatus } from '../../api/types'
import type { StatusTone } from '../../components/StatusBadge'
import { textoOpcional } from '../../components/formRules'
import { wallClockIn, zonedInstant } from '../../services/format'

// Los topes repiten los del backend (`reservations/domain/reservations.py`).
export const LIMITES = { name: 80, phone: 20, notes: 300, party: 50, minDuration: 30, maxDuration: 360 } as const
export const DURACION_POR_DEFECTO = 120

const entero = (min: number, max: number, que: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/u, `Escribe ${que} en números`)
    .refine((valor) => Number(valor) >= min && Number(valor) <= max, `Entre ${String(min)} y ${String(max)}`)

export const reservationSchema = z.object({
  customer_name: z.string().trim().min(1, 'Escribe a nombre de quién').max(LIMITES.name, `Usa como máximo ${String(LIMITES.name)} caracteres`),
  phone: textoOpcional(LIMITES.phone),
  party_size: entero(1, LIMITES.party, 'cuántos vienen'),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Elige el día'),
  time: z.string().regex(/^\d{2}:\d{2}$/u, 'Elige la hora'),
  duration_minutes: entero(LIMITES.minDuration, LIMITES.maxDuration, 'los minutos'),
  table_id: z.string(),
  notes: textoOpcional(LIMITES.notes),
})

export type ReservationValues = z.infer<typeof reservationSchema>

export function reservationDefaults(reservation: Reservation | null, day: string, timeZone: string): ReservationValues {
  if (reservation === null) {
    return {
      customer_name: '',
      phone: '',
      party_size: '2',
      day,
      time: '20:00',
      duration_minutes: String(DURACION_POR_DEFECTO),
      table_id: '',
      notes: '',
    }
  }
  const reloj = wallClockIn(reservation.reserved_for, timeZone)
  return {
    customer_name: reservation.customer_name,
    phone: reservation.phone,
    party_size: String(reservation.party_size),
    day: reloj.day,
    time: reloj.time,
    duration_minutes: String(reservation.duration_minutes),
    table_id: reservation.table_id === null ? '' : String(reservation.table_id),
    notes: reservation.notes,
  }
}

export function reservationRequest(values: ReservationValues, timeZone: string): ReservationRequest {
  return {
    customer_name: values.customer_name,
    phone: values.phone,
    party_size: Number(values.party_size),
    reserved_for: zonedInstant(values.day, values.time, timeZone),
    duration_minutes: Number(values.duration_minutes),
    table_id: values.table_id === '' ? null : Number(values.table_id),
    notes: values.notes,
  }
}

export const STATUS_TONE: Record<ReservationStatus, StatusTone | undefined> = {
  booked: 'pending',
  seated: 'completed',
  cancelled: 'cancelled',
  no_show: 'cancelled',
}
