import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { createRole, updateRole } from '../../api/roles'
import type { Role } from '../../api/types'
import DialogFormActions from '../../components/DialogFormActions'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import { usePermissions } from '../../store/session'
import type { PermissionGroup } from './permissionGroups'
import PermissionPicker from './PermissionPicker'
import { withRole } from './roleCache'
import RoleNameField from './RoleNameField'
import { rolePayload, roleSchema, type RoleValues, valuesOf } from './roleSchema'
import { useRoleMutation } from './useRoleMutation'

interface RoleFormProps {
  /** `null` crea un rol. */
  readonly role: Role | null
  readonly groups: readonly PermissionGroup[]
  /** El rol se mira pero no se cambia. */
  readonly readOnly: boolean
  /** Al guardar, cancelar o cerrar: cierra la ventana. */
  readonly onDone: () => void
}

const FALLO = 'No se pudo guardar el rol.'

export default function RoleForm({ role, groups, readOnly, onDone }: RoleFormProps) {
  const granted = usePermissions()
  const { register, handleSubmit, formState, control } = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: valuesOf(role),
  })
  const guardar = useRoleMutation({
    mutationFn: (valores: RoleValues) => {
      const payload = rolePayload(valores, role)
      return role === null ? createRole(payload) : updateRole(role.id, payload)
    },
    roleId: role?.id,
    failure: FALLO,
    success: (guardado) => (role === null ? `Rol ${guardado.name} creado.` : `Rol ${guardado.name} guardado.`),
    updateCache: withRole,
    onSuccess: onDone,
    inlineError: true,
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((valores) => {
          guardar.mutate(valores)
        }),
      )}
    >
      <RoleNameField role={role} readOnly={readOnly} field={register('name')} error={formState.errors.name?.message} />
      <Controller
        control={control}
        name="permissions"
        render={({ field }) => (
          <PermissionPicker
            groups={groups}
            selected={field.value}
            onChange={field.onChange}
            granted={granted}
            readOnly={readOnly}
          />
        )}
      />

      {guardar.isError ? <FormMessage tone="error">{errorMessage(guardar.error, FALLO)}</FormMessage> : null}

      <DialogFormActions>
        <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onDone}>
          {readOnly ? 'Cerrar' : 'Cancelar'}
        </Button>
        {readOnly ? null : (
          <Button type="submit" size="lg" className="h-11 px-4" disabled={guardar.isPending}>
            <Icon name="confirmar" size={16} />
            <span>{guardar.isPending ? 'Guardando…' : 'Guardar'}</span>
          </Button>
        )}
      </DialogFormActions>
    </form>
  )
}
