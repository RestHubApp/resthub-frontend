// El único lugar que llama a `useForm`: la regla `no-restricted-imports` de
// eslint.config.js lo prohíbe en el resto de src.
import { type FieldValues, type UseFormHandleSubmit, type UseFormProps, type UseFormReturn, useForm } from 'react-hook-form'

import { focusFirstError } from './formSubmit'

/**
 * `useForm` de react-hook-form, con un solo foco al primer error.
 *
 * Tras un envío con errores, react-hook-form enfoca el primer campo con error
 * y vuelve a hacerlo en un `setTimeout`. Si para entonces la persona ya corrigió
 * ese campo y escribe en el siguiente, el segundo intento le quita el foco y lo
 * que escribía cae en otro campo con error (GES-23: el teléfono de una reserva
 * terminaba en «Personas»). Aquí se apaga ese foco y `handleSubmit` enfoca el
 * primer campo con error una sola vez, en el momento del envío.
 *
 * Devuelve lo mismo que `useForm`; solo cambia `handleSubmit`.
 */
export function useAppForm<TFieldValues extends FieldValues = FieldValues, TContext = unknown, TTransformedValues = TFieldValues>(
  props: UseFormProps<TFieldValues, TContext, TTransformedValues> = {},
): UseFormReturn<TFieldValues, TContext, TTransformedValues> {
  const form = useForm<TFieldValues, TContext, TTransformedValues>({ ...props, shouldFocusError: false })
  const { handleSubmit } = form
  const focusedSubmit: UseFormHandleSubmit<TFieldValues, TTransformedValues> = (onValid, onInvalid) =>
    handleSubmit(onValid, async (errors, event) => {
      await onInvalid?.(errors, event)
      focusFirstError(errors, event)
    })

  return { ...form, handleSubmit: focusedSubmit }
}
