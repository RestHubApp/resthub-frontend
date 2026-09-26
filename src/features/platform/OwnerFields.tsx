import type { UseFormRegisterReturn } from 'react-hook-form'

import PasswordField from '../../components/PasswordField'
import TextField from '../../components/TextField'
import { MIN_PASSWORD, soloLetras } from '../../services/fieldRules'

interface OwnerFieldsProps {
  /** Distingue los `id` cuando hay más de un formulario en la pantalla. */
  readonly idPrefix: string
  readonly fields: {
    readonly full_name: UseFormRegisterReturn
    readonly email: UseFormRegisterReturn
    readonly password: UseFormRegisterReturn
  }
  readonly errors: {
    readonly full_name?: string
    readonly email?: string
    readonly password?: string
  }
}

/**
 * Los datos de un encargado: el primero al dar de alta el restaurante, u
 * otro más desde la ficha. Recibe los campos ya registrados, así el alta
 * (`owner.full_name`) y «Agregar encargado» (`full_name`) los comparten.
 */
export default function OwnerFields({ idPrefix, fields, errors }: OwnerFieldsProps) {
  return (
    <div className="grid items-start gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField
          id={`${idPrefix}-full-name`}
          label="Nombre completo"
          placeholder="María Quispe Rojas"
          icon="perfil"
          autoComplete="off"
          sanitize={soloLetras}
          field={fields.full_name}
          error={errors.full_name}
        />
      </div>
      <TextField
        id={`${idPrefix}-email`}
        label="Correo"
        placeholder="nombre@correo.com"
        type="email"
        inputMode="email"
        autoComplete="off"
        spellCheck={false}
        hint="Con este correo entra a RestHub."
        field={fields.email}
        error={errors.email}
      />
      <PasswordField
        id={`${idPrefix}-password`}
        label="Contraseña inicial"
        placeholder={`Mínimo ${String(MIN_PASSWORD)} caracteres`}
        autoComplete="new-password"
        hint="Díctasela y pídele que la cambie en Mi perfil."
        field={fields.password}
        error={errors.password}
      />
    </div>
  )
}
