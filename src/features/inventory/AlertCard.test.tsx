import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { ingredient } from '#jest/fixtures/inventory'
import { AlertCard } from './AlertCard'

describe('AlertCard', () => {
  it('ofrece registrar la compra solo a quien puede gestionar', async () => {
    const onPurchase = jest.fn()
    const item = ingredient({ name: 'Limón' })
    const { rerender } = render(<AlertCard ingredient={item} canManage onPurchase={onPurchase} />)

    await userEvent.click(screen.getByRole('button', { name: 'Registrar compra de Limón' }))
    expect(onPurchase).toHaveBeenCalledTimes(1)

    rerender(<AlertCard ingredient={item} canManage={false} onPurchase={onPurchase} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
