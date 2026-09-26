import { useState } from 'react'

import type { OrderMenuItem } from '../../../api/types'
import FormDialog from '../../../components/FormDialog'
import { Button } from '../../../components/ui/button'
import { formatCents, formatMoney, toCents } from '../../../services/format'
import ModifierOptionButton from './ModifierOptionButton'
import type { DraftModifier } from './useOrderDraft'

interface ModifierDialogProps {
  /** El plato a configurar; `null` cierra la ventana. */
  readonly item: OrderMenuItem | null
  readonly onConfirm: (item: OrderMenuItem, modifiers: DraftModifier[]) => void
  readonly onClose: () => void
}

type Elegidas = Readonly<Record<string, readonly string[]>>

function toggle(elegidas: Elegidas, grupo: string, opcion: string, maximo: number): Elegidas {
  const actuales = elegidas[grupo] ?? []
  if (actuales.includes(opcion)) {
    return { ...elegidas, [grupo]: actuales.filter((nombre) => nombre !== opcion) }
  }
  // Con máximo uno se comporta como radio: elegir otra reemplaza la anterior.
  const siguientes = maximo === 1 ? [opcion] : [...actuales, opcion].slice(-maximo)
  return { ...elegidas, [grupo]: siguientes }
}

/**
 * Tamaño, término y extras de un plato, antes de sumarlo al pedido.
 *
 * Un grupo obligatorio (mínimo uno) no deja confirmar hasta elegir. El precio
 * se actualiza con lo elegido: es lo que se le va a cobrar a la mesa.
 */
export default function ModifierDialog({ item, onConfirm, onClose }: ModifierDialogProps) {
  const [elegidas, setElegidas] = useState<Elegidas>({})
  if (item === null) {
    return null
  }
  const grupos = item.modifier_groups
  const faltan = grupos.filter((grupo) => (elegidas[grupo.name] ?? []).length < grupo.min_choices)
  const modifiers: DraftModifier[] = grupos.flatMap((grupo) =>
    grupo.options
      .filter((opcion) => (elegidas[grupo.name] ?? []).includes(opcion.name))
      .map((opcion) => ({ group: grupo.name, option: opcion.name, price: opcion.price })),
  )
  const total = toCents(item.price) + modifiers.reduce((suma, m) => suma + toCents(m.price), 0)
  const cerrar = () => {
    setElegidas({})
    onClose()
  }
  const alternar = (grupo: string, opcion: string, maximo: number) => {
    setElegidas((antes) => toggle(antes, grupo, opcion, maximo))
  }

  return (
    <FormDialog
      open
      title={item.name}
      description={`Precio base ${formatMoney(item.price)}`}
      onOpenChange={(abierto) => {
        if (!abierto) {
          cerrar()
        }
      }}
    >
      {grupos.map((grupo) => (
        <fieldset key={grupo.name} className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1 text-sm font-medium">
            {grupo.name}
            <span className="ml-2 text-xs text-muted-foreground">
              {grupo.min_choices > 0 ? 'Obligatorio' : 'Opcional'}
              {grupo.max_choices > 1 ? ` · hasta ${String(grupo.max_choices)}` : ''}
            </span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {grupo.options.map((opcion) => (
              <ModifierOptionButton
                key={opcion.name}
                name={opcion.name}
                price={opcion.price}
                selected={(elegidas[grupo.name] ?? []).includes(opcion.name)}
                onToggle={() => {
                  alternar(grupo.name, opcion.name, grupo.max_choices)
                }}
              />
            ))}
          </div>
        </fieldset>
      ))}
      <Button
        type="button"
        size="lg"
        className="h-12 text-base"
        disabled={faltan.length > 0}
        onClick={() => {
          onConfirm(item, modifiers)
          setElegidas({})
        }}
      >
        {faltan.length > 0 ? `Elige ${faltan[0]?.name.toLowerCase() ?? ''}` : `Agregar · ${formatCents(total)}`}
      </Button>
    </FormDialog>
  )
}
