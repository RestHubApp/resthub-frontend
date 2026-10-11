import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { supplier } from '#jest/fixtures/inventory'
import { SupplierSelect } from './SupplierSelect'

describe('SupplierSelect', () => {
  it('sin proveedores, pide darlos de alta primero', () => {
    render(<SupplierSelect suppliers={[]} value="" onChange={jest.fn()} />)

    expect(screen.getByRole('option', { name: 'Da de alta un proveedor primero' })).toBeInTheDocument()
  })

  it('avisa el proveedor elegido', async () => {
    const onChange = jest.fn()
    render(<SupplierSelect suppliers={[supplier({ id: 4, name: 'Mercado Central' })]} value="" onChange={onChange} />)

    await userEvent.selectOptions(screen.getByLabelText('Proveedor'), '4')

    expect(onChange).toHaveBeenCalledWith('4')
  })
})
