import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { dish } from '#jest/fixtures/charge'
import { CourtesyActions } from './CourtesyActions'

function renderActions({ isCourtesy = false, isPending = false, isReasonOpen = false } = {}) {
  render(
    <CourtesyActions
      item={dish({ is_courtesy: isCourtesy })}
      isPending={isPending}
      isReasonOpen={isReasonOpen}
      onRevoke={jest.fn()}
      onInvite={jest.fn()}
    />,
  )
}

describe('CourtesyActions', () => {
  it('no deja abrir el motivo mientras se guarda un cambio del plato', () => {
    renderActions({ isPending: true })

    expect(screen.getByRole('button', { name: 'Invitar' })).toBeDisabled()
  })

  it('no abre un segundo motivo', () => {
    renderActions({ isReasonOpen: true })

    expect(screen.getByRole('button', { name: 'Invitar' })).toBeDisabled()
  })

  it('volver a cobrar una cortesía espera a que termine el cambio anterior', () => {
    renderActions({ isCourtesy: true, isPending: true })

    expect(screen.getByRole('button', { name: 'Cobrar' })).toBeDisabled()
  })
})
