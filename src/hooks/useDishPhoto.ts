import { useQuery } from '@tanstack/react-query'

import { dishPhotoQuery } from '@/api/menu'

/**
 * La foto de un plato lista para un `<img>`: `url` es `null` mientras llega.
 * Con `version` en `null` (el plato no tiene foto) o `isEnabled` apagado no se
 * pide nada.
 */
export function useDishPhoto(itemId: number, version: number | null, isEnabled: boolean) {
  const photo = useQuery({ ...dishPhotoQuery(itemId, version ?? 0), enabled: version !== null && isEnabled })
  return { url: photo.data ?? null, isFailed: photo.isError }
}
