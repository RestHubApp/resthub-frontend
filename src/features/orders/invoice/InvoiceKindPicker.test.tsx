import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'

import { mountScreen } from '#jest/harness'
import { InvoiceKindPicker } from './InvoiceKindPicker'

describe('tipo de comprobante', () => {
  it('marca el tipo elegido y avisa al cambiar', async () => {
    const onChange = jest.fn()
    const { user } = mountScreen(<InvoiceKindPicker kind="boleta" onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'Boleta' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Factura' }))

    expect(onChange).toHaveBeenCalledWith('factura')
  })
})
