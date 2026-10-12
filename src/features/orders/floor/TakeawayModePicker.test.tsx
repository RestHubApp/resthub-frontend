import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'

import { mountScreen } from '#jest/harness'
import { TakeawayModePicker } from './TakeawayModePicker'

describe('modo del pedido para llevar', () => {
  it('marca el modo elegido y avisa al cambiar', async () => {
    const onChange = jest.fn()
    const { user } = mountScreen(<TakeawayModePicker value="takeaway" onChange={onChange} />)

    expect(screen.getByRole('radio', { name: 'Recoge en local' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'Delivery' }))

    expect(onChange).toHaveBeenCalledWith('delivery')
  })
})
