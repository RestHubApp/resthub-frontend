import type { MenuItem } from '@/api/types'
import { DishPhoto } from '@/components/DishPhoto'
import { Icon } from '@/components/Icon'
import { hasPhoto } from '@/hooks/useDishPhoto'
import { DishPhotoPicker } from './DishPhotoPicker'
import { useDishPhotoActions } from './useDishPhotoActions'

interface DishPhotoFieldProps {
  readonly item: MenuItem
}

/**
 * La foto del plato en su ficha: verla, subir otra o quitarla.
 *
 * El archivo se reduce en el celular antes de enviarlo. Esta vista muestra la
 * foto aunque la cuenta haya ocultado las fotos de la carta en Apariencia:
 * aquí se administra.
 */
export function DishPhotoField({ item }: DishPhotoFieldProps) {
  const { upload, remove } = useDishPhotoActions(item.id)
  const id = `foto-plato-${String(item.id)}`

  return (
    <section aria-labelledby={`${id}-titulo`} className="flex flex-col gap-2">
      <h3 id={`${id}-titulo`} className="m-0 text-sm font-semibold">
        Foto del plato
      </h3>
      {hasPhoto(item.photo_version) ? (
        <DishPhoto itemId={item.id} version={item.photo_version} isVisible className="aspect-4/3 w-full rounded-lg" />
      ) : (
        <p className="m-0 flex items-center gap-2 rounded-lg bg-muted px-3 py-4 text-sm text-muted-foreground">
          <Icon name="noPhoto" size={18} />
          <span>Este plato no tiene foto.</span>
        </p>
      )}
      <DishPhotoPicker
        id={id}
        dishName={item.name}
        hasPhoto={hasPhoto(item.photo_version)}
        isUploading={upload.isPending}
        isPending={upload.isPending || remove.isPending}
        onPick={upload.mutate}
        onRemove={remove.mutate}
      />
    </section>
  )
}
