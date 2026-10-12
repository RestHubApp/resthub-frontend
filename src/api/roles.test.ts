import { describe, expect, it } from '@jest/globals'

import { canAssignRole } from './roles'

const TAKE = 'orders.take'

describe('canAssignRole', () => {
  it('se puede dar un rol cuyos permisos están todos entre los propios', () => {
    expect(canAssignRole({ permissions: [TAKE] }, [TAKE, 'staff.manage'])).toBe(true)
  })

  it('no se puede dar un rol con un permiso que falta', () => {
    expect(canAssignRole({ permissions: [TAKE, 'cash.manage'] }, [TAKE])).toBe(false)
  })

  it('un rol sin permisos lo puede dar cualquiera', () => {
    expect(canAssignRole({ permissions: [] }, [])).toBe(true)
  })
})
