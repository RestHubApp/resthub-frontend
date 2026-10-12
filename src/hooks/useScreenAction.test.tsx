import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'

import { SCREEN_ACTIONS } from './screenActions'
import { useScreenAction } from './useScreenAction'

function Probe() {
  const action = useScreenAction('abrir-caja')
  return (
    <>
      <output>{`${useLocation().search}|${String(action.isRequested)}`}</output>
      <button type="button" onClick={action.clear}>
        Cerrar
      </button>
    </>
  )
}

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Probe />
    </MemoryRouter>,
  )
}

describe('useScreenAction', () => {
  it('pide abrir el diálogo cuando la dirección lo trae', () => {
    renderAt('/caja?accion=abrir-caja&otro=1')
    expect(screen.getByRole('status')).toHaveTextContent('?accion=abrir-caja&otro=1|true')
  })

  it('al cerrar borra solo ese parámetro de la dirección', async () => {
    renderAt('/caja?accion=abrir-caja&otro=1')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(screen.getByRole('status')).toHaveTextContent('?otro=1|false')
  })

  it('ignora un valor que no es el suyo y no toca la dirección', async () => {
    renderAt('/caja?accion=cualquier-cosa')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(screen.getByRole('status')).toHaveTextContent('?accion=cualquier-cosa|false')
  })

  it('no pide nada sin parámetro', () => {
    renderAt('/caja')
    expect(screen.getByRole('status')).toHaveTextContent('|false')
  })
})

describe('SCREEN_ACTIONS', () => {
  it('no repite ids', () => {
    const ids = SCREEN_ACTIONS.map((action) => action.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
