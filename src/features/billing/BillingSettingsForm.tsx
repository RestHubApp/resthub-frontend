import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import type { BillingSettings } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { TextField } from '@/components/TextField'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { billingErrorMessage } from '@/services/billingErrors'
import { settingsSchema, valuesOf, type SettingsValues } from './billingSettingsSchema'
import { SolCredentialsFields } from './SolCredentialsFields'
import { useSaveBillingSettings } from './useSaveBillingSettings'

interface BillingSettingsFormProps {
  readonly settings: BillingSettings
  /** Se llama al guardar; la hoja que lo contiene se cierra. */
  readonly onSaved?: (() => void) | undefined
}

/**
 * Los datos fiscales del local y sus credenciales SOL de SUNAT.
 *
 * El usuario y la clave SOL no se muestran nunca: si están cargados solo se
 * ofrece reemplazarlos, y sin escribirlos el servidor conserva los que tenía.
 */
export function BillingSettingsForm({ settings, onSaved }: BillingSettingsFormProps) {
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema(settings)),
    defaultValues: valuesOf(settings),
  })
  const { register, handleSubmit, formState } = form
  const errorOf = (field: keyof SettingsValues): string | undefined => formState.errors[field]?.message
  const save = useSaveBillingSettings(onSaved)

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit(handleSubmit((values) => {
      save.mutate(values)
    }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="fiscal-ruc" label="RUC del local" inputMode="numeric" field={register('ruc')} error={errorOf('ruc')} />
        <TextField id="fiscal-razon" label="Razón social" field={register('legal_name')} error={errorOf('legal_name')} />
      </div>
      <TextField id="fiscal-direccion" label="Dirección fiscal" field={register('address')} error={errorOf('address')} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField id="fiscal-igv" label="IGV (%)" inputMode="decimal" hint="18 en el régimen general; la tasa reducida si el local es MYPE de restaurantes." field={register('igv_rate')} error={errorOf('igv_rate')} />
        <TextField id="fiscal-serie-b" label="Serie de boletas" field={register('boleta_series')} error={errorOf('boleta_series')} />
        <TextField id="fiscal-serie-f" label="Serie de facturas" field={register('factura_series')} error={errorOf('factura_series')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="fiscal-serie-nc-b" label="Serie de notas de crédito de boletas" hint="Las que anulan una boleta, como BC01." field={register('boleta_credit_note_series')} error={errorOf('boleta_credit_note_series')} />
        <TextField id="fiscal-serie-nc-f" label="Serie de notas de crédito de facturas" hint="Las que anulan una factura, como FC01." field={register('factura_credit_note_series')} error={errorOf('factura_credit_note_series')} />
      </div>
      <SolCredentialsFields form={form} hasCredentials={settings.has_sol_credentials} savedRuc={settings.ruc} />
      {save.isError ? <FormMessage tone="error">{billingErrorMessage(save.error, 'No se pudieron guardar los datos.')}</FormMessage> : null}
      <Button type="submit" className="self-end" disabled={save.isPending}>
        {save.isPending ? 'Guardando…' : 'Guardar datos fiscales'}
      </Button>
    </form>
  )
}
