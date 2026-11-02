import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { purchaseOrder } from '#jest/fixtures/inventory'
import type { PurchaseOrder } from '@/api/types'
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
    await userEvent.type(screen.getByLabelText(`Costo real por g de ${line.ingredient_name}`), '4')

    expect(onQuantity).toHaveBeenCalledWith('3')
    expect(onUnitCost).toHaveBeenCalledWith('4')
  })

  it('lo pedido y los campos van en la misma unidad base, a la vista', () => {
    const line = { ...purchaseOrder().lines[0], quantity: '5000.000', unit: 'g' } as PurchaseOrder['lines'][number]
    render(<ReceiveLineRow line={line} quantity="5000.000" unitCost="0.004" onQuantity={jest.fn()} onUnitCost={jest.fn()} />)

    expect(screen.getByText('Pedido: 5000 g')).toBeInTheDocument()
    expect(screen.queryByText(/5 kg/u)).not.toBeInTheDocument()
    expect(screen.getByText('g')).toBeVisible()
    expect(screen.getByText('S/ por g')).toBeVisible()
  })
})
