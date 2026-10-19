import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'

import { restaurantCard, restaurantSummary } from '#jest/fixtures/platform'
import { mountScreen } from '#jest/harness'
import { OwnersList } from './OwnersList'
import { RestaurantHeader } from './RestaurantHeader'
import { RestaurantStatusCard } from './RestaurantStatusCard'
import { RestaurantsTable } from './RestaurantsTable'

const NAME = 'La Esquina'

describe('OwnersList', () => {
  it('sin encargados avisa que no hay ninguno', () => {
    mountScreen(<OwnersList restaurantId={1} owners={[]} />)

    expect(screen.getByText('Este restaurante no tiene encargados.')).toBeInTheDocument()
  })

  it('lista cada encargado con su estado', () => {
    const owners = [
      { id: 1, full_name: 'Lucho Ramos', email: 'lucho@esquina.pe', is_active: true, must_change_password: false },
      { id: 2, full_name: 'Ana Paz', email: 'ana@esquina.pe', is_active: false, must_change_password: false },
    ]
    mountScreen(<OwnersList restaurantId={1} owners={owners} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Activa')).toBeInTheDocument()
    expect(screen.getByText('Inactiva')).toBeInTheDocument()
  })
})

describe('RestaurantHeader', () => {
  it('muestra el nombre y el identificador del restaurante', () => {
    mountScreen(<RestaurantHeader restaurant={restaurantCard({ name: NAME, slug: 'la-esquina' })} />)

    expect(screen.getByRole('heading', { name: NAME })).toBeInTheDocument()
    expect(screen.getByText('la-esquina', { selector: 'code' })).toBeInTheDocument()
  })
})

describe('RestaurantStatusCard', () => {
  it('un restaurante activo lo dice', () => {
    mountScreen(<RestaurantStatusCard restaurant={restaurantCard({ is_active: true })} />)

    expect(screen.getByText('Restaurante activo')).toBeInTheDocument()
  })

  it('un restaurante desactivado lo dice', () => {
    mountScreen(<RestaurantStatusCard restaurant={restaurantCard({ is_active: false })} />)

    expect(screen.getByText('Restaurante desactivado')).toBeInTheDocument()
  })
})

describe('RestaurantsTable', () => {
  it('con error muestra el aviso y deja reintentar', async () => {
    const onRetry = jest.fn()
    const { user } = mountScreen(
      <RestaurantsTable items={[]} isLoading={false} emptyMessage="Nada" error={new Error('falló')} onRetry={onRetry} />,
    )

    await user.click(await screen.findByRole('button', { name: /reintentar/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('sin error lista los restaurantes', () => {
    mountScreen(
      <RestaurantsTable items={[restaurantSummary({ name: NAME })]} isLoading={false} emptyMessage="Nada" error={null} onRetry={jest.fn()} />,
    )

    expect(screen.getByRole('link', { name: NAME })).toBeInTheDocument()
  })
})
