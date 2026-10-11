import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { RecipeFooter } from './RecipeFooter'

const BASE = { empty: false, hadRecipe: true, dirty: true, pending: false }

describe('RecipeFooter', () => {
  it('con insumos, guarda y avisa de los cambios pendientes', () => {
    render(<RecipeFooter {...BASE} />)

    expect(screen.getByRole('button', { name: 'Guardar receta' })).toBeEnabled()
    expect(screen.getByText('Hay cambios sin guardar.')).toBeInTheDocument()
  })

  it('sin insumos en una receta existente, ofrece borrarla y lo explica', () => {
    render(<RecipeFooter {...BASE} empty />)

    expect(screen.getByRole('button', { name: 'Borrar receta' })).toBeInTheDocument()
    expect(screen.getByText('Sin insumos: al guardar, el plato queda sin receta y sin costo.')).toBeInTheDocument()
  })

  it('sin cambios o mientras guarda, el botón se bloquea', () => {
    const { rerender } = render(<RecipeFooter {...BASE} dirty={false} />)
    expect(screen.getByRole('button', { name: 'Guardar receta' })).toBeDisabled()

    rerender(<RecipeFooter {...BASE} pending />)
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()
  })
})
