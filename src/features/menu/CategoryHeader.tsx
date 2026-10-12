import type { MenuSection } from '@/api/types'
import { CategoryActions } from './CategoryActions'
import { CategoryTitle } from './CategoryTitle'
import type { Direction } from './menuOrder'

interface CategoryHeaderProps {
  readonly category: MenuSection
  readonly headingId: string
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMove: (direction: Direction) => void
  readonly onAddItem: () => void
}

/** El título de una categoría, su resumen y lo que se hace con ella. */
export function CategoryHeader({ category, headingId, isFirst, isLast, onMove, onAddItem }: CategoryHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b px-5 pb-4 md:flex-row md:items-start md:justify-between">
      <CategoryTitle category={category} headingId={headingId} />
      <CategoryActions category={category} isFirst={isFirst} isLast={isLast} onMove={onMove} onAddItem={onAddItem} />
    </div>
  )
}
