import { reorderCategories, reorderItems } from '../../api/menu'
import type { MenuSection } from '../../api/types'
import { withCategoryOrder, withItemOrder } from './menuCache'
import { type Direction, moveId } from './menuOrder'
import { useMenuChange } from './useMenuChange'

interface ItemOrder {
  readonly categoryId: number
  readonly ids: readonly number[]
}

/** Subir y bajar categorías y platos, con el cambio a la vista al instante. */
export function useMenuOrder(categories: readonly MenuSection[]) {
  const categorias = useMenuChange<readonly number[]>({
    send: (ids) => reorderCategories(ids),
    preview: (menu, ids) => withCategoryOrder(menu, ids),
    failure: 'No se pudo cambiar el orden de las categorías.',
  })
  const platos = useMenuChange<ItemOrder>({
    send: ({ categoryId, ids }) => reorderItems(categoryId, ids),
    preview: (menu, { categoryId, ids }) => withItemOrder(menu, categoryId, ids),
    failure: 'No se pudo cambiar el orden de los platos.',
  })

  return {
    moveCategory: (categoryId: number, direction: Direction) => {
      categorias.mutate(moveId(categories.map((categoria) => categoria.id), categoryId, direction))
    },
    moveItem: (section: MenuSection, itemId: number, direction: Direction) => {
      platos.mutate({
        categoryId: section.id,
        ids: moveId(section.items.map((plato) => plato.id), itemId, direction),
      })
    },
  }
}
