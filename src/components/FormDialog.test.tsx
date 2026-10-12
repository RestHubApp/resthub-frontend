import { describe, expect, it } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { FormDialog } from './FormDialog'

// Como la ventana de cobro: quien la abre la monta y la desmonta entera al cerrar.
function Host() {
  const [isShown, setShown] = useState(false)
  return (
    <>
      <button type="button" onClick={() => { setShown(true) }}>Cobrar</button>
      {isShown ? (
        <FormDialog open title="Cobrar pedido" onOpenChange={() => { setShown(false) }}>
          <p>Formulario</p>
        </FormDialog>
      ) : null}
    </>
  )
}

describe('FormDialog: retorno del foco', () => {
  it('desmontada por quien la abre, devuelve el foco al botón «Cobrar» al cerrar con Escape', async () => {
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Host />
      </QueryClientProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Cobrar' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => { expect(screen.queryByRole('dialog')).not.toBeInTheDocument() })
    await waitFor(() => { expect(screen.getByRole('button', { name: 'Cobrar' })).toHaveFocus() })
  })
})
