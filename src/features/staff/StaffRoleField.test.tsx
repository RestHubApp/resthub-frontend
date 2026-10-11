import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import type { UseFormRegisterReturn } from 'react-hook-form'

import { ROLE_OWNER, ROLE_WAITER } from '#jest/fixtures/platform'
import { StaffRoleField } from './StaffRoleField'

const FIELD: UseFormRegisterReturn = { name: 'role_id', onChange: () => Promise.resolve(), onBlur: () => Promise.resolve(), ref: () => undefined }

describe('StaffRoleField', () => {
  it('ofrece los roles para elegir', () => {
    render(<StaffRoleField field={FIELD} roles={[ROLE_OWNER, ROLE_WAITER]} />)
    expect(screen.getByRole('combobox', { name: 'Rol' })).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('en la cuenta propia solo muestra el rol', () => {
    render(<StaffRoleField field={FIELD} roles={[ROLE_OWNER]} lockedRoleLabel="Encargado" />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByText('Encargado')).toBeInTheDocument()
  })
})
