import { menuQueryKey, removeMenuPhoto, uploadMenuPhoto } from '@/api/menu'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'
import { photoProblem, preparePhoto } from './dishPhotoFile'
import { withItem } from './menuCache'
import { MENU_KEY } from './useMenuData'

/** Subir (o cambiar) y quitar la foto de un plato; la carta en caché queda con la versión nueva al instante. */
export function useDishPhotoActions(itemId: number) {
  const upload = useNotifiedMutation({
    mutationFn: async (file: File) => {
      const problem = photoProblem(file)
      if (problem !== null) {
        throw new Error(problem)
      }
      return uploadMenuPhoto(itemId, await preparePhoto(file))
    },
    updateCache: (queryClient, item) => {
      queryClient.setQueryData(MENU_KEY, (menu) => menu && withItem(menu, item))
    },
    invalidate: [menuQueryKey],
    success: () => 'Foto guardada.',
    failure: 'No se pudo guardar la foto. Prueba con otra imagen.',
  })
  const remove = useNotifiedMutation({
    mutationFn: () => removeMenuPhoto(itemId),
    updateCache: (queryClient, item) => {
      queryClient.setQueryData(MENU_KEY, (menu) => menu && withItem(menu, item))
    },
    invalidate: [menuQueryKey],
    success: () => 'Foto quitada.',
    failure: 'No se pudo quitar la foto.',
  })
  return { upload, remove }
}
