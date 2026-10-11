import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { createRole, updateRole } from '@/api/roles'
import type { Role } from '@/api/types'
import { DialogFormActions } from '@/components/DialogFormActions'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/api'
import { usePermissions } from '@/store/session'
import type { PermissionGroup } from './permissionGroups'
import { PermissionPicker } from './PermissionPicker'
import { withRole } from './roleCache'
import { RoleNameField } from './RoleNameField'
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

const FAILURE = 'No se pudo guardar el rol.'

export function RoleForm({ role, groups, readOnly, onDone }: RoleFormProps) {
  const granted = usePermissions()
  const { register, handleSubmit, formState, control } = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: valuesOf(role),
  })
  const save = useRoleMutation({
    mutationFn: (values: RoleValues) => {
      const payload = rolePayload(values, role)
      return role === null ? createRole(payload) : updateRole(role.id, payload)
    },
    roleId: role?.id,
    failure: FAILURE,
    success: (saved) => (role === null ? `Rol ${saved.name} creado.` : `Rol ${saved.name} guardado.`),
    updateCache: withRole,
    onSuccess: onDone,
    inlineError: true,
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          save.mutate(values)
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

      {save.isError ? <FormMessage tone="error">{errorMessage(save.error, FAILURE)}</FormMessage> : null}

      <DialogFormActions>
        <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onDone}>
          {readOnly ? 'Cerrar' : 'Cancelar'}
        </Button>
        {readOnly ? null : (
          <Button type="submit" size="lg" className="h-11 px-4" disabled={save.isPending}>
            <Icon name="confirmar" size={16} />
            <span>{save.isPending ? 'Guardando…' : 'Guardar'}</span>
          </Button>
        )}
      </DialogFormActions>
    </form>
  )
}
