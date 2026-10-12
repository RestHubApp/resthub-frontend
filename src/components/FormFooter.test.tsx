import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FormFooter } from './FormFooter'

const IDLE = { isError: false, error: null, isPending: false }
const SAVE = 'Guardar'
const SAVING = 'Guardando…'
const SUBMIT = { label: SAVE, pendingLabel: SAVING }

describe('FormFooter', () => {
  it('muestra Cancelar y la acción, y Cancelar avisa', async () => {
    const onCancel = jest.fn()
    render(<FormFooter mutation={IDLE} failureText="Falló." onCancel={onCancel} submit={SUBMIT} />)
    expect(screen.getByRole('button', { name: SAVE })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mientras envía cambia la etiqueta y bloquea la acción', () => {
    render(<FormFooter mutation={{ ...IDLE, isPending: true }} failureText="Falló." onCancel={jest.fn()} submit={SUBMIT} />)
    expect(screen.getByRole('button', { name: SAVING })).toBeDisabled()
  })

  it('sin etiqueta de envío usa «Guardando…»', () => {
    render(<FormFooter mutation={{ isPending: true }} onCancel={jest.fn()} submit={{ label: 'Crear plato' }} />)
    expect(screen.getByRole('button', { name: SAVING })).toBeDisabled()
  })

  it('si el envío falló, anuncia el error con el texto de respaldo', () => {
    render(<FormFooter mutation={{ ...IDLE, isError: true, error: new Error('x') }} failureText="Falló." onCancel={jest.fn()} submit={SUBMIT} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Falló.')
  })

  it('sin texto de respaldo no muestra error: el formulario ya lo muestra', () => {
    render(<FormFooter mutation={{ ...IDLE, isError: true, error: new Error('x') }} onCancel={jest.fn()} submit={SUBMIT} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('en solo lectura ofrece únicamente cerrar', () => {
    render(<FormFooter mutation={IDLE} onCancel={jest.fn()} cancelLabel="Cerrar" />)
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: SAVE })).not.toBeInTheDocument()
  })

  it('una acción con onClick no envía el formulario y respeta isDisabled', () => {
    render(<FormFooter mutation={IDLE} onCancel={jest.fn()} submit={{ label: 'Emitir', onClick: jest.fn(), isDisabled: true }} />)
    expect(screen.getByRole('button', { name: 'Emitir' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Emitir' })).toHaveAttribute('type', 'button')
  })
})
