import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { purchaseOrder } from '#jest/fixtures/inventory'
import { ReceiveLineRow } from './ReceiveLineRow'

describe('ReceiveLineRow', () => {
  it('avisa lo que se escribe en cantidad y en costo', async () => {
    const line = purchaseOrder().lines[0]
    if (line === undefined) {
      throw new Error('La orden de prueba debe tener líneas.')
    }
    const onQuantity = jest.fn()
    const onUnitCost = jest.fn()
    render(<ReceiveLineRow line={line} quantity="" unitCost="" onQuantity={onQuantity} onUnitCost={onUnitCost} />)

    await userEvent.type(screen.getByLabelText(`Cantidad recibida de ${line.ingredient_name}`), '3')
    await userEvent.type(screen.getByLabelText(`Costo real por unidad de ${line.ingredient_name}`), '4')

    expect(onQuantity).toHaveBeenCalledWith('3')
    expect(onUnitCost).toHaveBeenCalledWith('4')
  })
})
