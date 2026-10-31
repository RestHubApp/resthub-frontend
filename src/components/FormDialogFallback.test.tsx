import { describe, expect, it } from '@jest/globals'
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'

import { FormDialog } from './FormDialog'
import { FormMessage } from './FormMessage'

const OWN_ERROR = 'La contraseña actual no es esa.'

// Como «Cambiar contraseña»: falla la primera vez, guarda la segunda y la ventana sigue abierta.
function RetryingForm() {
  const attempts = useRef(0)
  const save = useMutation({
    mutationFn: async () => {
      attempts.current += 1
      if (attempts.current === 1) throw new Error(OWN_ERROR)
      await Promise.resolve()
    },
  })
  return (
    <>
      {save.isError ? <FormMessage tone="error">{OWN_ERROR}</FormMessage> : null}
      {save.isSuccess ? <FormMessage tone="ok">Guardado.</FormMessage> : null}
      <button type="button" onClick={() => { save.mutate() }}>Guardar</button>
    </>
  )
}

describe('FormDialog: aviso de respaldo', () => {
  it('un reintento que guarda quita el «No se pudo guardar»', async () => {
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <FormDialog open title="Cambiar contraseña" onOpenChange={() => undefined}>
          <RetryingForm />
        </FormDialog>
      </QueryClientProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText(OWN_ERROR)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Guardado.')).toBeInTheDocument()
    expect(screen.queryByText(/No se pudo guardar\. Los datos siguen aquí/u)).not.toBeInTheDocument()
  })
})
