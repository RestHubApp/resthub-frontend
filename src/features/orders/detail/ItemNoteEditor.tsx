import { Suspense } from 'react'

import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { lazyNamed } from '@/components/lazyNamed'
import { Button } from '@/components/ui/button'
import type { OrderItemResponse } from '@/api/types'

// El diálogo trae react-hook-form y zod: se baja la primera vez que se edita una nota.
const ItemNoteDialog = lazyNamed(() => import('./ItemNoteDialog'), 'ItemNoteDialog')

interface ItemNoteEditorProps {
  readonly item: OrderItemResponse
  readonly isEditing: boolean
  readonly isPending: boolean
  readonly onEditingChange: (isEditing: boolean) => void
  readonly onSave: (notes: string) => void
}

/** El botón para agregar o cambiar la nota de un plato y su diálogo, que se carga al abrirlo. */
export function ItemNoteEditor({ item, isEditing, isPending, onEditingChange, onSave }: ItemNoteEditorProps) {
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="w-fit px-3"
        onClick={() => {
          onEditingChange(true)
        }}
      >
        <Icon glyph={icons.note} size={16} />
        <span>{item.notes === '' ? 'Agregar nota' : 'Cambiar nota'}</span>
      </Button>
      {isEditing ? (
        <Suspense fallback={null}>
          <ItemNoteDialog
            open={isEditing}
            onOpenChange={onEditingChange}
            dish={item.name}
            notes={item.notes}
            pending={isPending}
            onSave={onSave}
          />
        </Suspense>
      ) : null}
    </>
  )
}
