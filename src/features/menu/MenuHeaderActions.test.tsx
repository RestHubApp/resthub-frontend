import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MenuHeaderActions } from './MenuHeaderActions'

describe('MenuHeaderActions', () => {
  it('dispara cada acción con su botón', async () => {
    const onNewCategory = jest.fn()
    const onNewItem = jest.fn()
    render(<MenuHeaderActions canAddItem onNewCategory={onNewCategory} onNewItem={onNewItem} />)

    await userEvent.click(screen.getByRole('button', { name: 'Nueva categoría' }))
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo plato' }))

    expect(onNewCategory).toHaveBeenCalledTimes(1)
    expect(onNewItem).toHaveBeenCalledTimes(1)
  })

  it('deshabilita el plato nuevo sin categorías', () => {
    render(<MenuHeaderActions canAddItem={false} onNewCategory={jest.fn()} onNewItem={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Nuevo plato' })).toBeDisabled()
  })
})
