import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { ModifierGroup } from './ModifierGroup'

const GROUP = {
  name: 'Extras',
  min_choices: 0,
  max_choices: 2,
  options: [
    { name: 'Hielo', price: '0.00' },
    { name: 'Limón', price: '2.00' },
  ],
}

describe('ModifierGroup', () => {
  it('titula el grupo como opcional con su tope y marca lo elegido', () => {
    render(<ModifierGroup group={GROUP} chosen={['Limón']} onToggle={jest.fn()} />)

    expect(screen.getByRole('group', { name: /Extras/ })).toHaveTextContent('Opcional · hasta 2')
    expect(screen.getByRole('button', { name: /Limón/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Hielo/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('un grupo con mínimo se anuncia obligatorio y avisa qué opción se tocó', async () => {
    const onToggle = jest.fn()
    render(<ModifierGroup group={{ ...GROUP, min_choices: 1, max_choices: 1 }} chosen={[]} onToggle={onToggle} />)

    expect(screen.getByRole('group')).toHaveTextContent('Obligatorio')
    await userEvent.setup().click(screen.getByRole('button', { name: /Hielo/ }))

    expect(onToggle).toHaveBeenCalledWith('Hielo')
  })
})
