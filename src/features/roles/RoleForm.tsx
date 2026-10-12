import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import type { Role } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { onSubmit } from '@/hooks/formSubmit'
import type { PermissionGroup } from './permissionGroups'
import { RoleNameField } from './RoleNameField'
import { RolePermissionsField } from './RolePermissionsField'
import { roleSchema, type RoleValues, valuesOf } from './roleSchema'
import { ROLE_SAVE_FAILURE, useRoleSave } from './useRoleSave'

interface RoleFormProps {
  /** `null` crea un rol. */
  readonly role: Role | null
  readonly groups: readonly PermissionGroup[]
  /** El rol se mira pero no se cambia. */
  readonly readOnly: boolean
  /** Al guardar, cancelar o cerrar: cierra la ventana. */
  readonly onDone: () => void
}

/** El formulario de un rol: su nombre, sus permisos y los botones de guardar. */
export function RoleForm({ role, groups, readOnly, onDone }: RoleFormProps) {
  const { register, handleSubmit, formState, control } = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: valuesOf(role),
  })
  const save = useRoleSave(role, onDone)

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
      <RolePermissionsField control={control} groups={groups} readOnly={readOnly} />
      <FormFooter
        mutation={save}
        failureText={ROLE_SAVE_FAILURE}
        onCancel={onDone}
        cancelLabel={readOnly ? 'Cerrar' : 'Cancelar'}
        submit={readOnly ? undefined : { label: 'Guardar', icon: 'confirm' }}
      />
    </form>
  )
}
