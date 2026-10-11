import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'

import { mountScreen } from '#jest/harness'
import { CourtesyReason } from './CourtesyReason'

describe('motivo de la cortesía', () => {
  it('escribe el motivo y confirma', async () => {
    const onChange = jest.fn()
    const onConfirm = jest.fn()
    const { user } = mountScreen(
      <CourtesyReason itemName="Lomo" value="" isConfirmDisabled={false} onChange={onChange} onConfirm={onConfirm} />,
    )

    await user.type(screen.getByLabelText('Motivo de la cortesía de Lomo'), 'a')
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onChange).toHaveBeenCalledWith('a')
    expect(onConfirm).toHaveBeenCalled()
  })

  it('no deja confirmar si está desactivado', () => {
    mountScreen(
      <CourtesyReason itemName="Lomo" value="" isConfirmDisabled onChange={jest.fn()} onConfirm={jest.fn()} />,
    )

    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  })
})
