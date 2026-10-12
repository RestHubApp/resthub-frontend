import { describe, expect, it } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'

import { SCREEN_ACTIONS } from './screenActions'
import { useScreenAction } from './useScreenAction'

const OPEN_URL = '/caja?accion=abrir-caja&otro=1'

function Probe({ isApplicable = true }: { readonly isApplicable?: boolean }) {
  const action = useScreenAction('abrir-caja', { isApplicable })
  return (
    <>
      <output>{`${useLocation().search}|${String(action.isRequested)}`}</output>
      <button type="button" onClick={action.clear}>
        Cerrar
      </button>
    </>
  )
}

function renderAt(url: string, isApplicable = true) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Probe isApplicable={isApplicable} />
    </MemoryRouter>,
  )
}

describe('useScreenAction', () => {
  it('pide abrir el diálogo cuando la dirección lo trae', () => {
    renderAt(OPEN_URL)
    expect(screen.getByRole('status')).toHaveTextContent('?accion=abrir-caja&otro=1|true')
  })

  it('al cerrar borra solo ese parámetro de la dirección', async () => {
    renderAt(OPEN_URL)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(screen.getByRole('status')).toHaveTextContent('?otro=1|false')
  })

  it('ignora un valor que no es el suyo y no toca la dirección', async () => {
    renderAt('/caja?accion=cualquier-cosa')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(screen.getByRole('status')).toHaveTextContent('?accion=cualquier-cosa|false')
  })

  it('si la acción no aplica, no la pide y borra el parámetro sin tocar los demás', async () => {
    renderAt(OPEN_URL, false)

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('?otro=1|false')
    })
  })

  it('si la acción no aplica pero el parámetro es de otra, lo deja', () => {
    renderAt('/caja?accion=nueva-mesa', false)

    expect(screen.getByRole('status')).toHaveTextContent('?accion=nueva-mesa|false')
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
