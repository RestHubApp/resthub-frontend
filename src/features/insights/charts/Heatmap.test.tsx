import { describe, expect, it } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'

import type { HourlyCell } from '@/api/types'
import { Heatmap } from './Heatmap'

function slot(weekday: number, hour: number, paidOrders: number): HourlyCell {
  return {
    weekday,
    weekday_label: weekday === 1 ? 'Lunes' : 'Martes',
    hour,
    paid_orders: paidOrders,
    sales: '100.00',
    average_sales: '50.00',
  }
}

const CELLS = [slot(1, 12, 4), slot(1, 13, 0), slot(2, 12, 2), slot(2, 13, 6)]

function readCell(cell: HourlyCell) {
  return {
    title: `${cell.weekday_label} ${String(cell.hour)}`,
    rows: [{ label: 'Pedidos', value: String(cell.paid_orders) }],
  }
}

const ACTIVE = 'aria-activedescendant'
const CELL = 'gridcell'
const LAST = 'Martes 13. Pedidos: 6'

function mount() {
  return render(<Heatmap cells={CELLS} peak={CELLS[3] ?? null} label="Mapa de calor de prueba" describe={readCell} />)
}

describe('Heatmap', () => {
  it('es una grilla con nombre, filas por día y una celda por hora', () => {
    mount()
    const grid = screen.getByRole('grid', { name: 'Mapa de calor de prueba' })
    expect(grid).toHaveAttribute('tabindex', '0')
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.getAllByRole('columnheader', { name: /h$/u })).toHaveLength(2)
    expect(screen.getByRole('rowheader', { name: 'Lunes' })).toBeInTheDocument()
    expect(screen.getAllByRole(CELL)).toHaveLength(4)
    expect(screen.getByRole(CELL, { name: LAST })).toBeInTheDocument()
  })

  it('las flechas recorren las celdas y anuncian la señalada', () => {
    mount()
    const grid = screen.getByRole('grid')
    fireEvent.focus(grid)
    // Al enfocar queda señalada la última celda.
    const last = screen.getByRole(CELL, { name: LAST })
    expect(grid).toHaveAttribute(ACTIVE, last.id)
    fireEvent.keyDown(grid, { key: 'ArrowUp' })
    expect(grid).toHaveAttribute(ACTIVE, screen.getByRole(CELL, { name: 'Lunes 13. Pedidos: 0' }).id)
    fireEvent.keyDown(grid, { key: 'Home' })
    expect(grid).toHaveAttribute(ACTIVE, screen.getByRole(CELL, { name: 'Lunes 12. Pedidos: 4' }).id)
  })

  it('al salir del foco no queda ninguna celda señalada', () => {
    mount()
    const grid = screen.getByRole('grid')
    fireEvent.focus(grid)
    fireEvent.blur(grid)
    expect(grid).not.toHaveAttribute(ACTIVE)
  })
})
