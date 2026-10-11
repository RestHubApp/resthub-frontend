import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MenuFormActions } from './MenuFormActions'

describe('MenuFormActions', () => {
  it('cancela con el primer botón', async () => {
    const onCancel = jest.fn()
    render(<MenuFormActions icon="add" submitLabel="Crear plato" isPending={false} onCancel={onCancel} />)

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Crear plato' })).toBeEnabled()
  })

  it('bloquea el guardado y lo dice mientras se envía', () => {
    render(<MenuFormActions icon="confirm" submitLabel="Guardar" isPending onCancel={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()
  })
})
