import { cn } from 'cn'

import { hasPhoto, useDishPhoto } from '@/hooks/useDishPhoto'

interface DishPhotoProps {
  readonly itemId: number
  /** La `photo_version` del plato; `null`, sin foto. */
  readonly version: number | null
  /** Si la cuenta quiere ver las fotos (Apariencia). Apagado, no se pide ni ocupa lugar. */
  readonly isVisible: boolean
  /** Las medidas y el borde; por omisión, un cuadrado de 56 px. */
  readonly className?: string
}

/**
 * La foto de un plato, decorativa: el nombre del plato ya está al lado, así que no
 * lleva texto alternativo. Sin foto, con las fotos ocultas o si no llega, no
 * ocupa lugar. Mientras llega deja un recuadro del mismo tamaño para que la
 * lista no se corra.
 */
export function DishPhoto({ itemId, version, isVisible, className = 'size-14 rounded-lg' }: DishPhotoProps) {
  const { url, isFailed } = useDishPhoto(itemId, version, isVisible)

  if (!hasPhoto(version) || !isVisible || isFailed) {
    return null
  }
  const shape = cn('block shrink-0', className)
  return url === null ? (
    <span aria-hidden="true" data-testid="dish-photo-loading" className={cn(shape, 'animate-pulse bg-muted')} />
  ) : (
    <img src={url} alt="" data-testid="dish-photo" loading="lazy" decoding="async" className={cn(shape, 'bg-muted object-cover')} />
  )
}
