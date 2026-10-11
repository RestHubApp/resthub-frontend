import { useId } from 'react'

import type { PermissionInfo } from '@/api/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface PermissionOptionProps {
  readonly permission: PermissionInfo
  readonly checked: boolean
  /** Quien mira no tiene el permiso: no lo puede dar. */
  readonly missing: boolean
  /** El rol solo se mira. */
  readonly readOnly: boolean
  readonly onCheckedChange: (checked: boolean) => void
}

/** Un permiso del catálogo, con su casilla y, si no se puede dar, por qué. */
export function PermissionOption({
  permission,
  checked,
  missing,
  readOnly,
  onCheckedChange,
}: PermissionOptionProps) {
  const id = useId()
  const noteId = `${id}-nota`
  const nameId = `${id}-nombre`
  const shouldExplain = missing && !readOnly
  const isOff = missing || readOnly

  return (
    <li className="py-1">
      {/* La etiqueta envuelve la casilla: así nombra también el <input> oculto
          que Radix agrega dentro de un formulario. El botón se nombra con
          aria-labelledby, que es lo que leen todos los validadores. */}
      <Label className={`flex min-h-11 items-center gap-3 font-normal ${isOff ? '' : 'cursor-pointer'}`}>
        <Checkbox
          id={id}
          className="size-5"
          checked={checked}
          disabled={isOff}
          aria-labelledby={nameId}
          aria-describedby={shouldExplain ? noteId : undefined}
          onCheckedChange={(value) => {
            onCheckedChange(value === true)
          }}
        />
        <span className="flex min-w-0 flex-col gap-1">
          <span id={nameId} className="leading-snug font-medium">
            {permission.label}
          </span>
          {shouldExplain ? (
            <span id={noteId} className="text-xs text-muted-foreground">
              Tu cuenta no tiene este permiso, así que no puedes darlo.
            </span>
          ) : null}
        </span>
      </Label>
    </li>
  )
}
