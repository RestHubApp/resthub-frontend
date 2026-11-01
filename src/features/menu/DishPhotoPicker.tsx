import { useRef } from 'react'

import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { PHOTO_TYPES } from './dishPhotoFile'

interface DishPhotoPickerProps {
  readonly id: string
  readonly dishName: string
  readonly hasPhoto: boolean
  readonly isUploading: boolean
  readonly isPending: boolean
  readonly onPick: (file: File) => void
  readonly onRemove: () => void
}

/** Los botones de la foto: elegir una imagen (en el celular, también la cámara) y quitarla. */
export function DishPhotoPicker({ id, dishName, hasPhoto, isUploading, isPending, onPick, onRemove }: DishPhotoPickerProps) {
  const input = useRef<HTMLInputElement>(null)
  const uploadLabel = hasPhoto ? 'Cambiar foto' : 'Subir foto'

  return (
    <div className="flex flex-wrap gap-2">
      <input
        ref={input}
        id={id}
        type="file"
        accept={PHOTO_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-label={`Elegir la foto de ${dishName}`}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file !== undefined) {
            onPick(file)
          }
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          input.current?.click()
        }}
      >
        <Icon glyph={icons.upload} size={16} />
        <span>{isUploading ? 'Guardando…' : uploadLabel}</span>
      </Button>
      {hasPhoto ? (
        <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" disabled={isPending} onClick={onRemove}>
          <Icon glyph={icons.delete} size={16} />
          <span>Quitar foto</span>
        </Button>
      ) : null}
    </div>
  )
}
