import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'

import { notaConAlergia, pedido } from '#jest/fixtures/pedidos'
import { entrarComo, PERMISOS_ENCARGADO, PERMISOS_MESERO, servidor } from '#jest/harness'
import ItemNote from './ItemNote'
import { nextStepFor } from './nextStep'
import { prefetchBoard, prefetchFloor, prefetchKitchen } from './prefetchOrders'
import QuantityStepper from './QuantityStepper'
import { useCanTakeStep } from './useCanTakeStep'
import { useNow } from './useNow'

const SERVIDO = pedido({ status: 'served', waiter_id: 7 })
const DE_OTRO = pedido({ status: 'served', waiter_id: 8 })
const ACTIVOS = '/orders/active'

afterEach(() => {
  jest.useRealTimers()
})

describe('useCanTakeStep', () => {
  function puede(order = SERVIDO, estado = order.status) {
    return renderHook(() => useCanTakeStep(order, nextStepFor(estado))).result.current
  }

  it('el mesero cobra lo que atendió, pero no la mesa de otro', () => {
    entrarComo(PERMISOS_MESERO)
    expect(puede()).toBe(true)
    expect(puede(DE_OTRO)).toBe(false)
  })

  it('quien ve todos los pedidos cobra cualquiera', () => {
    entrarComo(PERMISOS_ENCARGADO)
    expect(puede(DE_OTRO)).toBe(true)
  })

  it('sin el permiso del paso, o sin paso, no hay botón; servir una mesa ajena sí vale', () => {
    entrarComo(PERMISOS_MESERO)
    expect(puede(pedido({ status: 'in_kitchen' }))).toBe(false)
    expect(puede(pedido({ status: 'paid' }))).toBe(false)
    expect(puede(pedido({ status: 'ready', waiter_id: 8 }))).toBe(true)
  })
})

describe('precargas de pedidos', () => {
  it('el salón adelanta mesas y carta según los permisos', async () => {
    const api = servidor().on('get', '/tables', []).on('get', '/menu', { categories: [] })
    entrarComo(['orders.take', 'menu.read'])
    prefetchFloor()
    await waitFor(() => {
      expect(api.llamadas('get', '/menu')).toHaveLength(1)
    })
    expect(api.llamadas('get', '/tables')).toHaveLength(0)
  })

  it('cocina y tablero adelantan los pedidos en curso solo con su permiso', async () => {
    const api = servidor().on('get', ACTIVOS, [])
    entrarComo(['menu.read'])
    prefetchKitchen()
    prefetchBoard()
    expect(api.llamadas('get', ACTIVOS)).toHaveLength(0)

    entrarComo(PERMISOS_MESERO)
    prefetchKitchen()
    await waitFor(() => {
      expect(api.llamadas('get', ACTIVOS)).toHaveLength(1)
    })
  })
})

describe('useNow', () => {
  it('refresca la hora con el intervalo pedido', () => {
    jest.useFakeTimers({ now: new Date('2026-09-26T12:00:00Z') })
    const { result } = renderHook(() => useNow(15_000))
    const inicio = result.current
    act(() => {
      jest.advanceTimersByTime(15_000)
    })
    expect(result.current - inicio).toBe(15_000)
  })
})

describe('QuantityStepper', () => {
  it('en uno, sin poder quitar, el menos queda desactivado; en el tope, el más', () => {
    render(<QuantityStepper name="Lomo" quantity={1} max={1} canRemove={false} onChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Uno menos de Lomo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Uno más de Lomo' })).toBeDisabled()
  })
})

describe('ItemNote', () => {
  it('sin nota no dibuja nada', () => {
    const { container } = render(<ItemNote note="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('una nota con alergia lleva la palabra «Alergia» y su etiqueta', () => {
    render(<ItemNote note="alérgico al maní" label="Nota del pedido" flag={notaConAlergia()} />)
    expect(screen.getByText('Alergia')).toBeInTheDocument()
    expect(screen.getByText(/Nota del pedido:/u)).toBeInTheDocument()
  })
})
