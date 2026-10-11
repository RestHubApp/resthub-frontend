import { z } from 'zod'

import type { Reservation, ReservationRequest, ReservationStatus } from '@/api/types'
import type { StatusTone } from '@/components/StatusBadge'
import { textoOpcional } from '@/components/formRules'
import { wallClockIn, zonedInstant } from '@/services/format'

// Los topes repiten los del backend (`reservations/domain/reservations.py`).
export const LIMITS = { name: 80, phone: 20, notes: 300, party: 50, minDuration: 30, maxDuration: 360 } as const
const DEFAULT_DURATION = 120

const integer = (min: number, max: number, that: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/u, `Escribe ${that} en números`)
    .refine((value) => Number(value) >= min && Number(value) <= max, `Entre ${String(min)} y ${String(max)}`)

export const reservationSchema = z.object({
  customer_name: z.string().trim().min(1, 'Escribe a nombre de quién').max(LIMITS.name, `Usa como máximo ${String(LIMITS.name)} caracteres`),
  phone: textoOpcional(LIMITS.phone),
  party_size: integer(1, LIMITS.party, 'cuántos vienen'),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Elige el día'),
  time: z.string().regex(/^\d{2}:\d{2}$/u, 'Elige la hora'),
  duration_minutes: integer(LIMITS.minDuration, LIMITS.maxDuration, 'los minutos'),
  table_id: z.string(),
  notes: textoOpcional(LIMITS.notes),
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
      duration_minutes: String(DEFAULT_DURATION),
      table_id: '',
      notes: '',
    }
  }
  const clock = wallClockIn(reservation.reserved_for, timeZone)
  return {
    customer_name: reservation.customer_name,
    phone: reservation.phone,
    party_size: String(reservation.party_size),
    day: clock.day,
    time: clock.time,
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
