import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ModifierGroupFields } from './ModifierGroupFields'
import { emptyGroup } from './modifierDrafts'

describe('ModifierGroupFields', () => {
  it('avisa del cambio de cada campo', async () => {
    const onChange = jest.fn()
    render(<ModifierGroupFields id="grupo-0" group={emptyGroup()} onChange={onChange} onRemove={jest.fn()} />)

    await userEvent.type(screen.getByLabelText('Grupo'), 'T')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Obligatorio' }))

    expect(onChange).toHaveBeenCalledWith({ name: 'T' })
    expect(onChange).toHaveBeenCalledWith({ required: true })
  })

  it('quita el grupo con su botón', async () => {
    const onRemove = jest.fn()
    render(<ModifierGroupFields id="grupo-0" group={{ ...emptyGroup(), name: 'Tamaño' }} onChange={jest.fn()} onRemove={onRemove} />)

    await userEvent.click(screen.getByRole('button', { name: 'Quitar el grupo Tamaño' }))

    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
