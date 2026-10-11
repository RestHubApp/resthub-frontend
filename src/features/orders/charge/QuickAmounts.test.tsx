import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'

import { mountScreen } from '#jest/harness'
import { QuickAmounts } from './QuickAmounts'

describe('atajos de monto recibido', () => {
  it('el monto exacto manda la cuenta con punto decimal', async () => {
    const onQuick = jest.fn()
    const { user } = mountScreen(<QuickAmounts totalCents={4250} onQuick={onQuick} />)

    await user.click(screen.getByRole('button', { name: 'Monto exacto' }))

    expect(onQuick).toHaveBeenCalledWith('42.50')
  })

  it('desactiva los billetes que no alcanzan', () => {
    mountScreen(<QuickAmounts totalCents={7500} onQuick={jest.fn()} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.slice(1).map((button) => (button as HTMLButtonElement).disabled)).toEqual([true, false, false])
  })
})
