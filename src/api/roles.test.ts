import { describe, expect, it } from 'vitest'

import { canAssignRole } from './roles'

const TOMAR = 'orders.take'

describe('canAssignRole', () => {
  it('se puede dar un rol cuyos permisos están todos entre los propios', () => {
    expect(canAssignRole({ permissions: [TOMAR] }, [TOMAR, 'staff.manage'])).toBe(true)
  })

  it('no se puede dar un rol con un permiso que falta', () => {
    expect(canAssignRole({ permissions: [TOMAR, 'cash.manage'] }, [TOMAR])).toBe(false)
  })

  it('un rol sin permisos lo puede dar cualquiera', () => {
    expect(canAssignRole({ permissions: [] }, [])).toBe(true)
  })
})
