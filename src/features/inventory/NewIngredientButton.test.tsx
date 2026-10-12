import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { NewIngredientButton } from './NewIngredientButton'

describe('NewIngredientButton', () => {
  it('avisa al pulsar Nuevo insumo', async () => {
    const onClick = jest.fn()
    render(<NewIngredientButton onClick={onClick} />)

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo insumo' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
