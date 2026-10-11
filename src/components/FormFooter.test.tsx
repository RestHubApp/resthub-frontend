import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FormFooter } from './FormFooter'

const IDLE = { isError: false, error: null, isPending: false }
const SUBMIT = { label: 'Guardar', pendingLabel: 'Guardando…' }

describe('FormFooter', () => {
  it('muestra Cancelar y la acción, y Cancelar avisa', async () => {
    const onCancel = jest.fn()
    render(<FormFooter mutation={IDLE} failureText="Falló." onCancel={onCancel} submit={SUBMIT} />)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mientras envía cambia la etiqueta y bloquea la acción', () => {
    render(<FormFooter mutation={{ ...IDLE, isPending: true }} failureText="Falló." onCancel={jest.fn()} submit={SUBMIT} />)
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()
  })

  it('si el envío falló, anuncia el error con el texto de respaldo', () => {
    render(<FormFooter mutation={{ ...IDLE, isError: true, error: new Error('x') }} failureText="Falló." onCancel={jest.fn()} submit={SUBMIT} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Falló.')
  })
})
