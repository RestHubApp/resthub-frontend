import { useState } from 'react'

import type { OrderMenuItem } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { FormMessage } from '@/components/FormMessage'
import { Button } from '@/components/ui/button'
import { formatCents, formatMoney, toCents } from '@/services/format'
import { ModifierOptionButton } from './ModifierOptionButton'
import type { DraftModifier } from './useOrderDraft'

interface ModifierDialogProps {
  /** El plato a configurar; `null` cierra la ventana. */
  readonly item: OrderMenuItem | null
  readonly onConfirm: (item: OrderMenuItem, modifiers: DraftModifier[]) => boolean | Promise<boolean | undefined>
  readonly onClose: () => void
}

type Selected = Readonly<Record<string, readonly string[]>>

function toggle(selected: Selected, group: string, option: string, max: number): Selected {
  const current = selected[group] ?? []
  if (current.includes(option)) {
    return { ...selected, [group]: current.filter((name) => name !== option) }
  }
  // Con máximo uno se comporta como radio: elegir otra reemplaza la anterior.
  const next = max === 1 ? [option] : [...current, option].slice(-max)
  return { ...selected, [group]: next }
}

/**
 * Tamaño, término y extras de un plato, antes de sumarlo al pedido.
 *
 * Un grupo obligatorio (mínimo uno) no deja confirmar hasta elegir. El precio
 * se actualiza con lo elegido: es lo que se le va a cobrar a la mesa.
 */
export function ModifierDialog({ item, onConfirm, onClose }: ModifierDialogProps) {
  const [selected, selectedSet] = useState<Selected>({})
  const [failure, setFailure] = useState(false)
  if (item === null) {
    return null
  }
  const groups = item.modifier_groups
  const missing = groups.filter((group) => (selected[group.name] ?? []).length < group.min_choices)
  const modifiers: DraftModifier[] = groups.flatMap((group) =>
    group.options
      .filter((option) => (selected[group.name] ?? []).includes(option.name))
      .map((option) => ({ group: group.name, option: option.name, price: option.price })),
  )
  const total = toCents(item.price) + modifiers.reduce((sum, m) => sum + toCents(m.price), 0)
  const close = () => {
    selectedSet({})
    onClose()
  }
  const toggleChoice = (group: string, option: string, max: number) => {
    selectedSet((antes) => toggle(antes, group, option, max))
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
      {groups.map((group) => (
        <fieldset key={group.name} className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1 text-sm font-medium">
            {group.name}
            <span className="ml-2 text-xs text-muted-foreground">
              {group.min_choices > 0 ? 'Obligatorio' : 'Opcional'}
              {group.max_choices > 1 ? ` · hasta ${String(group.max_choices)}` : ''}
            </span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {group.options.map((option) => (
              <ModifierOptionButton
                key={option.name}
                name={option.name}
                price={option.price}
                selected={(selected[group.name] ?? []).includes(option.name)}
                onToggle={() => {
                  toggleChoice(group.name, option.name, group.max_choices)
                }}
              />
            ))}
          </div>
        </fieldset>
      ))}
      {failure ? (
        <FormMessage tone="error">No se pudo agregar el plato. Las opciones siguen elegidas; vuelve a intentarlo.</FormMessage>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="h-12 text-base"
        disabled={missing.length > 0}
        onClick={() => {
          void Promise.resolve(onConfirm(item, modifiers)).then((accepted) => {
            if (accepted === false) {
              setFailure(true)
              return
            }
            setFailure(false)
            selectedSet({})
          })
        }}
      >
        {missing.length > 0 ? `Elige ${missing[0]?.name.toLowerCase() ?? ''}` : `Agregar · ${formatCents(total)}`}
      </Button>
    </FormDialog>
  )
}
