import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { CartLineList } from './CartLineList'

describe('CartLineList', () => {
  it('sin platos avisa que todavía no se eligió ninguno', () => {
    render(<CartLineList lines={[]} onQuantity={() => undefined} onNotes={() => undefined} />)

    expect(screen.getByText('Todavía no elegiste platos.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('con platos los lista', () => {
    const line = { lineKey: '1', menuItemId: 1, name: 'Lomo', unitPrice: '32.00', quantity: 2, notes: '', modifiers: [] }
    render(<CartLineList lines={[line]} onQuantity={() => undefined} onNotes={() => undefined} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Lomo')).toBeInTheDocument()
  })
})
