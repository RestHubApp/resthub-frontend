import { zodResolver } from '@hookform/resolvers/zod'
import { describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { z } from 'zod'

import { onSubmit } from './formSubmit'
import { useAppForm } from './useAppForm'

const schema = z.object({
  name: z.string().min(1, 'Falta el nombre'),
  phone: z.string(),
  party: z.string().regex(/^[1-9]\d*$/u, 'Falta cuántos'),
})

const NAME = 'Nombre'
const PHONE = 'Teléfono'
const PARTY = 'Personas'

function Probe({ onInvalid }: { readonly onInvalid?: () => void }) {
  const { register, handleSubmit, formState } = useAppForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', party: '' },
  })

  return (
    <form noValidate onSubmit={onSubmit(handleSubmit(() => undefined, onInvalid))}>
      <label htmlFor="name">{NAME}</label>
      <input id="name" {...register('name')} />
      <label htmlFor="phone">{PHONE}</label>
      <input id="phone" {...register('phone')} />
      <label htmlFor="party">{PARTY}</label>
      <input id="party" {...register('party')} />
      <p>{formState.errors.party?.message}</p>
      <button type="submit">Guardar</button>
    </form>
  )
}

// Termina lo que el formulario dejó en promesas (la validación), sin adelantar
// ningún temporizador.
async function settle() {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('useAppForm', () => {
  it('un envío con errores enfoca el primer campo con error, en el orden de la pantalla, y avisa a onInvalid', async () => {
    const onInvalid = jest.fn()
    render(<Probe onInvalid={onInvalid} />)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Falta cuántos')).toBeInTheDocument()
    expect(screen.getByLabelText(NAME)).toHaveFocus()
    expect(onInvalid).toHaveBeenCalledTimes(1)
  })

  it('el foco no vuelve a moverse después: lo que se escribe en el campo siguiente queda ahí', async () => {
    render(<Probe />)
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] })
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      await settle()
      expect(screen.getByLabelText(NAME)).toHaveFocus()
      fireEvent.input(screen.getByLabelText(NAME), { target: { value: 'Ana' } })
      await settle()
      screen.getByLabelText(PHONE).focus()
      act(() => {
        jest.runOnlyPendingTimers()
      })
    } finally {
      jest.useRealTimers()
    }

    expect(screen.getByLabelText(PHONE)).toHaveFocus()
  })
})
