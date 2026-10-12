import { describe, expect, it } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { ActionsMenu } from './ActionsMenu'
import { ConfirmDialog } from './ConfirmDialog'

const MENU = { name: 'Más acciones de Ana' }
const OPEN = { name: 'Abrir' }

// La confirmación se abre desde un botón o desde un elemento del menú «⋯».
function Host() {
  const [isOpen, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => { setOpen(true) }}>Abrir</button>
      <ActionsMenu
        label="Más acciones de Ana"
        items={[{ label: 'Desactivar', isDestructive: true, onSelect: () => { setOpen(true) } }]}
      />
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setOpen}
        title="¿Desactivar a Ana?"
        description="No podrá entrar."
        confirmLabel="Desactivar"
        onConfirm={() => undefined}
      />
    </>
  )
}

describe('ConfirmDialog: retorno del foco', () => {
  it('abierta desde el menú «⋯», devuelve el foco al botón «⋯» al cerrar con Escape', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByRole('button', MENU))
    await user.click(await screen.findByRole('menuitem', { name: 'Desactivar' }))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => { expect(screen.getByRole('button', MENU)).toHaveFocus() })
  })

  it('abierta desde estado, devuelve el foco al botón que la abrió al cancelar', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByRole('button', OPEN))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => { expect(screen.getByRole('button', OPEN)).toHaveFocus() })
  })
})
