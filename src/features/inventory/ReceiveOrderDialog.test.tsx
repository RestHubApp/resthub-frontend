import { describe, expect, it } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'

import { purchaseOrder } from '#jest/fixtures/inventory'
import type { PurchaseOrder } from '@/api/types'
import { ReceiveOrderDialog } from './ReceiveOrderDialog'

const five = purchaseOrder({ id: 5, number: 5 })
const seven = purchaseOrder({
  id: 7,
  number: 7,
  lines: five.lines.map((line) => ({ ...line, id: 71, ingredient_name: 'Papa', quantity: '2000', unit_cost: '0.003' })),
})

/** Como el panel de compras: la ventana siempre montada, abierta con la orden elegida. */
function Panel() {
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null)
  return (
    <>
      <button type="button" onClick={() => { setReceiving(five) }}>OC 5</button>
      <button type="button" onClick={() => { setReceiving(seven) }}>OC 7</button>
      <ReceiveOrderDialog order={receiving} onClose={() => { setReceiving(null) }} />
    </>
  )
}

const LEMON_QUANTITY = 'Cantidad recibida de Limón'

/** Abre la OC 5, corrige la cantidad recibida y la deja con «Cancelar». */
async function editFiveAndCancel() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Panel />
    </QueryClientProvider>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'OC 5' }))
  const quantity = screen.getByLabelText(LEMON_QUANTITY)
  await userEvent.clear(quantity)
  await userEvent.type(quantity, '4000')
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
}

describe('ReceiveOrderDialog', () => {
  it('tras «Cancelar», la siguiente orden abre con lo pedido y no con el borrador anterior', async () => {
    await editFiveAndCancel()
    await userEvent.click(screen.getByRole('button', { name: 'OC 7' }))

    expect(screen.getByLabelText('Cantidad recibida de Papa')).toHaveValue('2000')
    expect(screen.getByLabelText('Costo real por unidad de Papa')).toHaveValue('0.003')
  })

  it('al volver a abrir la misma orden tras «Cancelar», arranca otra vez con lo pedido', async () => {
    await editFiveAndCancel()
    await userEvent.click(screen.getByRole('button', { name: 'OC 5' }))

    expect(screen.getByLabelText(LEMON_QUANTITY)).toHaveValue('5000')
  })
})
