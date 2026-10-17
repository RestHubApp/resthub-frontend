import type { TwoFactorSetup } from '@/api/types'
import { QrCode } from './QrCode'
import { TwoFactorCodeForm } from './TwoFactorCodeForm'

interface TwoFactorSetupStepProps {
  readonly setup: TwoFactorSetup
  readonly confirm: { readonly isPending: boolean; readonly isError: boolean; readonly error: unknown; readonly mutate: (code: string) => void }
  readonly onCancel: () => void
}

/** `ABCD EFGH …`: la clave en grupos de cuatro, para escribirla a mano. */
function spaced(secret: string): string {
  return secret.replaceAll(/(.{4})(?=.)/g, '$1 ')
}

/**
 * Configurar la aplicación de verificación: escanear el QR (o escribir la
 * clave) y confirmar con el primer código.
 */
export function TwoFactorSetupStep({ setup, confirm, onCancel }: TwoFactorSetupStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <ol className="m-0 flex flex-col gap-2 pl-5">
        <li>Instala en tu celular una aplicación de verificación, como Google Authenticator, Microsoft Authenticator o Aegis.</li>
        <li>Escanea este código con la aplicación.</li>
        <li>Escribe abajo el código de seis dígitos que te muestra.</li>
      </ol>
      <div className="flex flex-col items-center gap-3">
        <QrCode value={setup.otpauth_uri} label="Código QR para la aplicación de verificación" />
        <p className="m-0 text-center text-sm text-muted-foreground">
          ¿No puedes escanearlo? Escribe esta clave en la aplicación:
          <span className="mt-1 block font-mono text-base text-foreground break-all">{spaced(setup.secret)}</span>
        </p>
        <a className="text-sm underline underline-offset-4" href={setup.otpauth_uri}>Abrir en la aplicación de este celular</a>
      </div>
      <TwoFactorCodeForm mutation={confirm} onCancel={onCancel} />
    </div>
  )
}
