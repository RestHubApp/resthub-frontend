import StatusBadge from '../../components/StatusBadge'

interface RestaurantStatusBadgeProps {
  readonly active: boolean
}

export default function RestaurantStatusBadge({ active }: RestaurantStatusBadgeProps) {
  return <StatusBadge label={active ? 'Activo' : 'Inactivo'} tone={active ? 'completed' : 'cancelled'} />
}
