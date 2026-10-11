import { describe, expect, it, jest } from '@jest/globals'
import { QueryClient } from '@tanstack/react-query'

import { rolesQueryKey } from '@/api/roles'
import { staffQueryKey } from '@/api/staff'
import type { StaffListResponse, StaffResponse } from '@/api/types'
import { saveStaffMember, STAFF_LIST_QUERY } from './staffList'

const NAME_ANA = 'Ana Pérez'
const NAME_BEATRIZ = 'Beatriz Gómez'

function member(id: number, fullName: string, roleId = 1): StaffResponse {
  return {
    id,
    full_name: fullName,
    email: `${String(id)}@resthub.dev`,
    role_id: roleId,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    role_label: 'Mesero',
  }
}

describe('saveStaffMember', () => {
  it('agrega un miembro nuevo en orden alfabético e incrementa el total', () => {
    const qc = new QueryClient()
    const initial: StaffListResponse = {
      items: [member(1, NAME_ANA), member(3, 'Carlos Soto')],
      total: 2,
    }
    qc.setQueryData(STAFF_LIST_QUERY.queryKey, initial)

    const fresh = member(2, NAME_BEATRIZ)
    saveStaffMember(qc, fresh)

    const actual = qc.getQueryData<StaffListResponse>(STAFF_LIST_QUERY.queryKey)
    expect(actual?.total).toBe(3)
    expect(actual?.items.map((i) => i.full_name)).toEqual([NAME_ANA, NAME_BEATRIZ, 'Carlos Soto'])
  })

  it('actualiza un miembro existente manteniendo el total', () => {
    const qc = new QueryClient()
    const initial: StaffListResponse = {
      items: [member(1, NAME_ANA), member(2, NAME_BEATRIZ)],
      total: 2,
    }
    qc.setQueryData(STAFF_LIST_QUERY.queryKey, initial)

    const edited = { ...member(2, 'Beatriz Zúñiga'), role_id: 2 }
    saveStaffMember(qc, edited)

    const actual = qc.getQueryData<StaffListResponse>(STAFF_LIST_QUERY.queryKey)
    expect(actual?.total).toBe(2)
    expect(actual?.items.map((i) => i.full_name)).toEqual([NAME_ANA, 'Beatriz Zúñiga'])
    expect(actual?.items[1]?.role_id).toBe(2)
  })

  it('invalida las consultas de personal y roles', () => {
    const qc = new QueryClient()
    const spy = jest.spyOn(qc, 'invalidateQueries')

    saveStaffMember(qc, member(1, NAME_ANA))

    expect(spy).toHaveBeenCalledWith({ queryKey: staffQueryKey })
    expect(spy).toHaveBeenCalledWith({ queryKey: rolesQueryKey })
  })

  it('no falla si la lista de personal aún no está en caché', () => {
    const qc = new QueryClient()
    saveStaffMember(qc, member(1, 'Ana Pérez'))
    expect(qc.getQueryData(STAFF_LIST_QUERY.queryKey)).toBeUndefined()
  })
})
