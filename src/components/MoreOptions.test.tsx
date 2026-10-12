import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MoreOptions } from './MoreOptions'

const EXPANDED = 'aria-expanded'
const NOTE = { name: 'Nota' }
const MORE = { name: /Más opciones/u }

describe('MoreOptions', () => {
  it('arranca cerrado, lo abre el botón y conserva lo escrito al cerrarlo', async () => {
    const user = userEvent.setup()
    render(
      <MoreOptions summary="Propina">
        <label>
          Nota
          <input />
        </label>
      </MoreOptions>,
    )
    const toggle = screen.getByRole('button', MORE)

    expect(toggle).toHaveAttribute(EXPANDED, 'false')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    await user.click(toggle)
    await user.type(screen.getByRole('textbox', NOTE), 'sin sal')
    await user.click(toggle)
    expect(toggle).toHaveAttribute(EXPANDED, 'false')
    await user.click(toggle)

    expect(screen.getByRole('textbox', NOTE)).toHaveValue('sin sal')
  })

  it('se mantiene abierto si algo de adentro lo exige', () => {
    render(
      <MoreOptions isForcedOpen>
        <p>Detalle</p>
      </MoreOptions>,
    )

    expect(screen.getByRole('button', MORE)).toHaveAttribute(EXPANDED, 'true')
    expect(screen.getByText('Detalle')).toBeVisible()
  })
})
