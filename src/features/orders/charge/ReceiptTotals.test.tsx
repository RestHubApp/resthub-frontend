import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { buildOrder } from '#jest/fixtures/charge'
import { mountScreen } from '#jest/harness'
import { ReceiptTotals } from './ReceiptTotals'

describe('totales del comprobante de cobro', () => {
  it('muestra el total y oculta propinas y recibido cuando no hay', () => {
    mountScreen(<ReceiptTotals order={buildOrder({ tips: '0.00' })} received="" />)

    expect(screen.getByText('Total cobrado')).toBeInTheDocument()
    expect(screen.queryByText('Propinas')).not.toBeInTheDocument()
    expect(screen.queryByText('Recibido')).not.toBeInTheDocument()
  })

  it('muestra propinas y recibido cuando existen', () => {
    mountScreen(<ReceiptTotals order={buildOrder({ tips: '3.00' })} received="50.00" />)

    expect(screen.getByText('Propinas')).toBeInTheDocument()
    expect(screen.getByText('Recibido')).toBeInTheDocument()
  })
})
