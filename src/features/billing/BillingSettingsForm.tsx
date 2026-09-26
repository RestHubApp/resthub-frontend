import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { billingQueryKey, billingSettingsQueryKey, updateBillingSettings } from '../../api/billing'
import type { BillingSettings } from '../../api/types'
import FormMessage from '../../components/FormMessage'
import TextField from '../../components/TextField'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'

const schema = z.object({
  ruc: z.string().trim().regex(/^(?:(?:10|15|17|20)\d{9})?$/u, 'El RUC tiene 11 dígitos y empieza en 10 o 20'),
  legal_name: z.string().trim().max(100, 'Usa como máximo 100 caracteres'),
  address: z.string().trim().max(200, 'Usa como máximo 200 caracteres'),
  igv_rate: z.string().trim().regex(/^\d{1,2}(?:[.,]\d{1,2})?$/u, 'Escribe un porcentaje como 18 o 10.5'),
  boleta_series: z.string().trim().toUpperCase().regex(/^B[A-Z0-9]{3}$/u, 'Cuatro caracteres, empieza con B'),
  factura_series: z.string().trim().toUpperCase().regex(/^F[A-Z0-9]{3}$/u, 'Cuatro caracteres, empieza con F'),
  provider_url: z.string().trim().max(300),
  provider_token: z.string().trim().max(300),
})
type Values = z.infer<typeof schema>

interface BillingSettingsFormProps {
  readonly settings: BillingSettings
}

function valuesOf(settings: BillingSettings): Values {
  return {
    ruc: settings.ruc,
    legal_name: settings.legal_name,
    address: settings.address,
    igv_rate: settings.igv_rate,
    boleta_series: settings.boleta_series,
    factura_series: settings.factura_series,
    provider_url: settings.provider_url,
    provider_token: '',
  }
}

/**
 * Los datos fiscales del local y la conexión con el proveedor autorizado.
 *
 * El token del proveedor no se muestra nunca: el campo vacío lo deja como
 * estaba. Sin RUC, razón social, ruta y token los comprobantes quedan «sin
 * enviar» y se reenvían después.
 */
export default function BillingSettingsForm({ settings }: BillingSettingsFormProps) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: valuesOf(settings),
  })
  const errorDe = (campo: keyof Values): string | undefined => formState.errors[campo]?.message
  const guardar = useMutation({
    mutationFn: (valores: Values) =>
      updateBillingSettings({
        ...valores,
        igv_rate: valores.igv_rate.replace(',', '.'),
        provider_token: valores.provider_token === '' ? null : valores.provider_token,
      }),
    onSuccess: (guardado) => {
      queryClient.setQueryData(billingSettingsQueryKey, guardado)
      void queryClient.invalidateQueries({ queryKey: billingQueryKey })
      push({ tone: 'info', message: 'Datos fiscales guardados.' })
    },
  })

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit(handleSubmit((valores) => {
      guardar.mutate(valores)
    }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="fiscal-ruc" label="RUC del local" inputMode="numeric" field={register('ruc')} error={errorDe('ruc')} />
        <TextField id="fiscal-razon" label="Razón social" field={register('legal_name')} error={errorDe('legal_name')} />
      </div>
      <TextField id="fiscal-direccion" label="Dirección fiscal" field={register('address')} error={errorDe('address')} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField id="fiscal-igv" label="IGV (%)" inputMode="decimal" hint="18 en el régimen general; la tasa reducida si el local es MYPE de restaurantes." field={register('igv_rate')} error={errorDe('igv_rate')} />
        <TextField id="fiscal-serie-b" label="Serie de boletas" field={register('boleta_series')} error={errorDe('boleta_series')} />
        <TextField id="fiscal-serie-f" label="Serie de facturas" field={register('factura_series')} error={errorDe('factura_series')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="fiscal-url" label="Ruta del proveedor (Nubefact)" placeholder="https://api.nubefact.com/api/v1/…" field={register('provider_url')} error={errorDe('provider_url')} />
        <TextField id="fiscal-token" label="Token del proveedor" type="password" autoComplete="off" hint={settings.has_provider_token ? 'Cargado. Déjalo vacío para no cambiarlo.' : 'Todavía no cargado.'} field={register('provider_token')} error={errorDe('provider_token')} />
      </div>
      {guardar.isError ? <FormMessage tone="error">{errorMessage(guardar.error, 'No se pudieron guardar los datos.')}</FormMessage> : null}
      <Button type="submit" className="self-end" disabled={guardar.isPending}>
        {guardar.isPending ? 'Guardando…' : 'Guardar datos fiscales'}
      </Button>
    </form>
  )
}
