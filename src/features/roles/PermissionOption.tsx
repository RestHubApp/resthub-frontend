import { useId } from 'react'

import type { PermissionInfo } from '../../api/types'
import { Checkbox } from '../../components/ui/checkbox'
import { Label } from '../../components/ui/label'

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
export default function PermissionOption({
  permission,
  checked,
  missing,
  readOnly,
  onCheckedChange,
}: PermissionOptionProps) {
  const id = useId()
  const notaId = `${id}-nota`
  const explicar = missing && !readOnly
  const apagado = missing || readOnly

  return (
    <li className="flex min-h-11 items-center gap-3 py-1">
      <Checkbox
        id={id}
        className="size-5"
        checked={checked}
        disabled={apagado}
        aria-describedby={explicar ? notaId : undefined}
        onCheckedChange={(valor) => {
          onCheckedChange(valor === true)
        }}
      />
      <div className="flex min-w-0 flex-col gap-1">
        <Label htmlFor={id} className={`leading-snug ${apagado ? '' : 'cursor-pointer'}`}>
          {permission.label}
        </Label>
        {explicar ? (
          <span id={notaId} className="text-xs text-muted-foreground">
            Tu cuenta no tiene este permiso, así que no puedes darlo.
          </span>
        ) : null}
      </div>
    </li>
  )
}
