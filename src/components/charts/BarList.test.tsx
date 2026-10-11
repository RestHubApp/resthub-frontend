import { describe, expect, it } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'

import { BarList } from './BarList'

const ROW = 'Lomo saltado: 10'
const DATA = [
  { key: 'a', label: 'Lomo saltado', value: 10, valueLabel: '10', details: [{ label: 'Ventas', value: 'S/ 100' }] },
  { key: 'b', label: 'Sin clasificar', value: 5, valueLabel: '5', tone: 'muted' as const },
]

describe('BarList', () => {
  it('lista cada fila con su valor en el nombre accesible', () => {
    render(<BarList data={DATA} label="Platos más vendidos" />)
    expect(screen.getByRole('list', { name: 'Platos más vendidos' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('button', { name: ROW })).toBeInTheDocument()
  })

  it('solo se enfoca la fila que tiene detalle, y el foco abre el tooltip', () => {
    render(<BarList data={DATA} label="Platos más vendidos" />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
    fireEvent.focus(screen.getByRole('button', { name: ROW }))
    expect(screen.getByText('S/ 100')).toBeInTheDocument()
    fireEvent.blur(screen.getByRole('button', { name: ROW }))
    expect(screen.queryByText('S/ 100')).not.toBeInTheDocument()
  })
})
