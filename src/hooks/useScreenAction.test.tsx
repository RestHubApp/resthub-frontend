import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'

import { SCREEN_ACTIONS } from './screenActions'
import { useScreenAction } from './useScreenAction'

function Probe({ onOpen }: { readonly onOpen: () => void }) {
  useScreenAction('abrir-caja', onOpen)
  return <output>{useLocation().search}</output>
}

function renderAt(url: string, onOpen: () => void) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Probe onOpen={onOpen} />
    </MemoryRouter>,
  )
}

describe('useScreenAction', () => {
  it('abre el diálogo pedido y borra el parámetro de la dirección', () => {
    const open = jest.fn()
    renderAt('/caja?accion=abrir-caja&otro=1', open)

    expect(open).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('?otro=1')
  })

  it('ignora un valor que no es el suyo y no toca la dirección', () => {
    const open = jest.fn()
    renderAt('/caja?accion=cualquier-cosa', open)

    expect(open).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('?accion=cualquier-cosa')
  })

  it('no hace nada sin parámetro', () => {
    const open = jest.fn()
    renderAt('/caja', open)

    expect(open).not.toHaveBeenCalled()
  })
})

describe('SCREEN_ACTIONS', () => {
  it('no repite ids', () => {
    const ids = SCREEN_ACTIONS.map((action) => action.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
