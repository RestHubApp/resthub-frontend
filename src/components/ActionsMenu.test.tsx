import { describe, expect, it } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ActionsMenu } from './ActionsMenu'

const MENU = { name: 'Más acciones de Ana' }

describe('ActionsMenu', () => {
  it('corre la acción elegida cuando el foco ya volvió al botón «⋯»', async () => {
    const user = userEvent.setup()
    const seen: boolean[] = []
    render(
      <ActionsMenu
        label="Más acciones de Ana"
        items={[{ label: 'Contraseña', onSelect: () => { seen.push(screen.getByRole('button', MENU).matches(':focus')) } }]}
      />,
    )
    const trigger = screen.getByRole('button', MENU)

    await user.click(trigger)
    await user.click(await screen.findByRole('menuitem', { name: 'Contraseña' }))

    await waitFor(() => { expect(seen).toEqual([true]) })
  })
})
