import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  type ScreenReaderInstructions,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { SectionHeading } from '@/components/SectionHeading'
import type { MenuGroup } from '@/features/shell/menuLayout'
import type { NavEntry } from '@/features/shell/navigation'
import { MenuRow } from './MenuRow'

interface MenuGroupListProps {
  readonly group: MenuGroup
  readonly title: string
  readonly description?: string | undefined
  readonly entries: readonly NavEntry[]
  readonly emptyText: string
  readonly isBarFull: boolean
  readonly onReorder: (group: MenuGroup, from: number, to: number) => void
  readonly onStep: (group: MenuGroup, index: number, step: -1 | 1) => void
  readonly onToggleBar: (path: string) => void
}

// Solo se arrastra hacia arriba y abajo: la fila no se sale de su columna.
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 })

const INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'Para mover una pantalla, enfoca su asa y pulsa Espacio. Usa las flechas para cambiarla de lugar y pulsa Espacio para soltarla. Escape cancela.',
}

/** Los avisos del arrastre, en español y con el nombre de la pantalla. */
function announcementsFor(entries: readonly NavEntry[]): Announcements {
  const nameOf = (id: string | number) => entries.find((entry) => entry.to === id)?.label ?? 'La pantalla'
  const placeOf = (id: string | number) => String(entries.findIndex((entry) => entry.to === id) + 1)
  const total = String(entries.length)
  return {
    onDragStart: ({ active }) => `Levantaste ${nameOf(active.id)}, que estaba en el lugar ${placeOf(active.id)} de ${total}.`,
    onDragOver: ({ active, over }) => (over === null ? `${nameOf(active.id)} ya no está sobre ningún lugar.` : `${nameOf(active.id)} está sobre el lugar ${placeOf(over.id)} de ${total}.`),
    onDragEnd: ({ active, over }) => (over === null ? `${nameOf(active.id)} volvió a su lugar.` : `${nameOf(active.id)} quedó en el lugar ${placeOf(over.id)} de ${total}.`),
    onDragCancel: ({ active }) => `Cancelaste el movimiento: ${nameOf(active.id)} sigue en el lugar ${placeOf(active.id)}.`,
  }
}

/** Un grupo del menú (la barra de abajo o «Más») como lista que se puede reordenar arrastrando. */
export function MenuGroupList({ group, title, description, entries, emptyText, isBarFull, onReorder, onStep, onToggleBar }: MenuGroupListProps) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const ids = entries.map((entry) => entry.to)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over !== null && active.id !== over.id) {
      onReorder(group, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading description={description}>{title}</SectionHeading>
      {entries.length === 0 ? (
        <p className="m-0 rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <DndContext
          id={`menu-${group}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[verticalOnly]}
          accessibility={{ announcements: announcementsFor(entries), screenReaderInstructions: INSTRUCTIONS }}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul aria-label={title} className="m-0 flex list-none flex-col gap-1.5 p-0">
              {entries.map((entry, index) => (
                <MenuRow
                  key={entry.to}
                  entry={entry}
                  index={index}
                  count={entries.length}
                  isInBar={group === 'bar'}
                  isBarFull={isBarFull}
                  onStep={(at, step) => {
                    onStep(group, at, step)
                  }}
                  onToggleBar={onToggleBar}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  )
}
