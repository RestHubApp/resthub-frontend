import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { supplier } from '#jest/fixtures/inventory'
import { SupplierRow } from './SupplierRow'

describe('SupplierRow', () => {
  it('sin datos de contacto, lo dice', () => {
    render(<SupplierRow supplier={supplier({ contact: '', phone: '', notes: '' })} canManage={false} onEdit={jest.fn()} />)

    expect(screen.getByText('Sin datos de contacto')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('quien gestiona puede editarlo', async () => {
    const onEdit = jest.fn()
    render(<SupplierRow supplier={supplier({ contact: 'Ana', phone: '999' })} canManage onEdit={onEdit} />)

    expect(screen.getByText('Ana · 999')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })
})
