import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'

import { ingredient } from '#jest/fixtures/inventory'
import { PurchaseLineEditor } from './PurchaseLineEditor'
import { emptyLine } from './purchaseLines'

/** El editor con su línea en estado, como en la ventana de la orden. */
function Editor() {
  const [line, setLine] = useState(emptyLine())
  return <PurchaseLineEditor index={0} line={line} ingredients={[ingredient()]} onChange={setLine} onRemove={jest.fn()} />
}

describe('PurchaseLineEditor', () => {
  it('con un insumo en gramos, la cantidad y el costo dicen su unidad aunque ya tengan valor', async () => {
    render(<Editor />)
    await userEvent.selectOptions(screen.getByLabelText('Insumo de la línea 1'), 'Limón')

    await userEvent.type(screen.getByLabelText('Cantidad en g'), '2000')
    await userEvent.type(screen.getByLabelText('Costo por g'), '0.0035')

    expect(screen.getByLabelText('Costo por g')).toHaveValue('0.0035')
    expect(screen.getByText('g')).toBeVisible()
    expect(screen.getByText('S/ por g')).toBeVisible()
  })
})
