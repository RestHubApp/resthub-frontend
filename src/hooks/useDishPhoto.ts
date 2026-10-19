import { useQuery } from '@tanstack/react-query'

import { dishPhotoQuery } from '@/api/menu'

/** Un servidor anterior a las fotos no manda `photo_version`: sin número no hay foto. */
export function hasPhoto(version: number | null | undefined): version is number {
  return typeof version === 'number'
}

/**
 * La foto de un plato lista para un `<img>`: `url` es `null` mientras llega.
 * Con `version` en `null` (el plato no tiene foto) o `isEnabled` apagado no se
 * pide nada.
 */
export function useDishPhoto(itemId: number, version: number | null, isEnabled: boolean) {
  const photo = useQuery({ ...dishPhotoQuery(itemId, version ?? 0), enabled: hasPhoto(version) && isEnabled })
  return { url: photo.data ?? null, isFailed: photo.isError }
}
