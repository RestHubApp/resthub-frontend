import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import type { MenuItem, MenuSection } from '@/api/types'
import { CategoryTitle } from './CategoryTitle'

function dish(id: number, changes: Partial<MenuItem> = {}): MenuItem {
  return {
    id,
    category_id: 1,
    name: `Plato ${String(id)}`,
    description: '',
    price: '10.00',
    is_active: true,
    is_available: true,
    modifier_groups: [],
    ...changes,
  } as MenuItem
}

function section(changes: Partial<MenuSection>): MenuSection {
  return { id: 1, name: 'Entradas', is_active: true, items: [], ...changes } as MenuSection
}

describe('CategoryTitle', () => {
  it('cuenta los platos en carta en singular y plural', () => {
    const { rerender } = render(<CategoryTitle category={section({ items: [dish(1)] })} headingId="h" />)
    expect(screen.getByText('1 plato en carta')).toBeInTheDocument()

    rerender(<CategoryTitle category={section({ items: [dish(1), dish(2)] })} headingId="h" />)
    expect(screen.getByText('2 platos en carta')).toBeInTheDocument()
  })

  it('suma los agotados y marca la categoría inactiva', () => {
    const category = section({ is_active: false, items: [dish(1), dish(2, { is_available: false })] })
    render(<CategoryTitle category={category} headingId="h" />)

    expect(screen.getByRole('heading', { name: 'Entradas', level: 2 })).toHaveAttribute('id', 'h')
    expect(screen.getByText('2 platos en carta, 1 agotado hoy')).toBeInTheDocument()
    expect(screen.getByText('Inactiva')).toBeInTheDocument()
  })
})
