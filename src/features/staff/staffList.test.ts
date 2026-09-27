import { describe, expect, it, jest } from '@jest/globals'
import { QueryClient } from '@tanstack/react-query'

import { rolesQueryKey } from '../../api/roles'
import { staffQueryKey } from '../../api/staff'
import type { StaffListResponse, StaffResponse } from '../../api/types'
import { saveStaffMember, STAFF_LIST_QUERY } from './staffList'

const NOMBRE_ANA = 'Ana Pérez'
const NOMBRE_BEATRIZ = 'Beatriz Gómez'

function miembro(id: number, full_name: string, role_id = 1): StaffResponse {
  return {
    id,
    full_name,
    email: `${String(id)}@resthub.dev`,
    role_id,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    role_label: 'Mesero',
  }
}

describe('saveStaffMember', () => {
  it('agrega un miembro nuevo en orden alfabético e incrementa el total', () => {
    const qc = new QueryClient()
    const inicial: StaffListResponse = {
      items: [miembro(1, NOMBRE_ANA), miembro(3, 'Carlos Soto')],
      total: 2,
    }
    qc.setQueryData(STAFF_LIST_QUERY.queryKey, inicial)

    const nuevo = miembro(2, NOMBRE_BEATRIZ)
    saveStaffMember(qc, nuevo)

    const actual = qc.getQueryData<StaffListResponse>(STAFF_LIST_QUERY.queryKey)
    expect(actual?.total).toBe(3)
    expect(actual?.items.map((i) => i.full_name)).toEqual([NOMBRE_ANA, NOMBRE_BEATRIZ, 'Carlos Soto'])
  })

  it('actualiza un miembro existente manteniendo el total', () => {
    const qc = new QueryClient()
    const inicial: StaffListResponse = {
      items: [miembro(1, NOMBRE_ANA), miembro(2, NOMBRE_BEATRIZ)],
      total: 2,
    }
    qc.setQueryData(STAFF_LIST_QUERY.queryKey, inicial)

    const editado = { ...miembro(2, 'Beatriz Zúñiga'), role_id: 2 }
    saveStaffMember(qc, editado)

    const actual = qc.getQueryData<StaffListResponse>(STAFF_LIST_QUERY.queryKey)
    expect(actual?.total).toBe(2)
    expect(actual?.items.map((i) => i.full_name)).toEqual([NOMBRE_ANA, 'Beatriz Zúñiga'])
    expect(actual?.items[1]?.role_id).toBe(2)
  })

  it('invalida las consultas de personal y roles', () => {
    const qc = new QueryClient()
    const spy = jest.spyOn(qc, 'invalidateQueries')

    saveStaffMember(qc, miembro(1, NOMBRE_ANA))

    expect(spy).toHaveBeenCalledWith({ queryKey: staffQueryKey })
    expect(spy).toHaveBeenCalledWith({ queryKey: rolesQueryKey })
  })

  it('no falla si la lista de personal aún no está en caché', () => {
    const qc = new QueryClient()
    saveStaffMember(qc, miembro(1, 'Ana Pérez'))
    expect(qc.getQueryData(STAFF_LIST_QUERY.queryKey)).toBeUndefined()
  })
})
