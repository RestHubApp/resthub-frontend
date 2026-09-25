import type { OrderMenuSection } from '../../../api/types'

// "aji" encuentra "Ají de gallina": sin tildes ni mayusculas.
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

/**
 * Las secciones de la carta que se muestran.
 *
 * Una busqueda mira la carta entera, sin importar la categoria elegida: quien
 * escribe "chicha" no quiere que la respuesta dependa de la ficha que toco
 * antes. Las secciones que quedan sin platos no se muestran.
 */
export function visibleSections(
  sections: readonly OrderMenuSection[],
  search: string,
  categoryId: number | null,
): OrderMenuSection[] {
  const term = normalize(search)
  return sections
    .filter((section) => section.is_active)
    .filter((section) => term !== '' || categoryId === null || section.id === categoryId)
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.is_active && (term === '' || normalize(item.name).includes(term)),
      ),
    }))
    .filter((section) => section.items.length > 0)
}
