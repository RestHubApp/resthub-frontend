import type { OrderMenuItem } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { FormMessage } from '@/components/FormMessage'
import { Button } from '@/components/ui/button'
import { formatCents, formatMoney } from '@/services/format'
import { ModifierGroup } from './ModifierGroup'
import { summarize } from './modifierSelection'
import { useModifierChoices } from './useModifierChoices'
import type { DraftModifier } from './useOrderDraft'

interface ModifierDialogProps {
  /** El plato a configurar; `null` cierra la ventana. */
  readonly item: OrderMenuItem | null
  readonly onConfirm: (item: OrderMenuItem, modifiers: DraftModifier[]) => boolean | Promise<boolean | undefined>
  readonly onClose: () => void
}

/**
 * Tamaño, término y extras de un plato, antes de sumarlo al pedido.
 *
 * Un grupo obligatorio (mínimo uno) no deja confirmar hasta elegir. El precio
 * se actualiza con lo elegido: es lo que se le va a cobrar a la mesa.
 */
export function ModifierDialog({ item, onConfirm, onClose }: ModifierDialogProps) {
  const { selected, hasFailure, choose, reset, settle } = useModifierChoices()
  if (item === null) {
    return null
  }
  const { missing, modifiers, totalCents } = summarize(item, selected)
  const close = () => {
    reset()
    onClose()
  }

  return (
    <FormDialog
      open
      title={item.name}
      description={`Precio base ${formatMoney(item.price)}`}
      onOpenChange={(open) => {
        if (!open) {
          close()
        }
      }}
    >
      {item.modifier_groups.map((group) => (
        <ModifierGroup
          key={group.name}
          group={group}
          chosen={selected[group.name] ?? []}
          onToggle={(option) => {
            choose(group.name, option, group.max_choices)
          }}
        />
      ))}
      {hasFailure ? (
        <FormMessage tone="error">No se pudo agregar el plato. Las opciones siguen elegidas; vuelve a intentarlo.</FormMessage>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="h-12 text-base"
        disabled={missing.length > 0}
        onClick={() => {
          void Promise.resolve(onConfirm(item, modifiers)).then(settle)
        }}
      >
        {missing.length > 0 ? `Elige ${missing[0]?.name.toLowerCase() ?? ''}` : `Agregar · ${formatCents(totalCents)}`}
      </Button>
    </FormDialog>
  )
}
