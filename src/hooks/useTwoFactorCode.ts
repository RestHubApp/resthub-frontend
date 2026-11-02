import { useState } from 'react'

const MISSING_CODE = 'Escribe el código de verificación.'

/**
 * El segundo paso del acceso y de «Confirma tu contraseña» (RFS-22): si el
 * servidor pide el código, aparece el campo; un envío sin el código no sale y
 * lo dice en el campo, en vez de volver a recibir el mismo pedido en silencio.
 */
export function useTwoFactorCode() {
  const [code, setCodeValue] = useState('')
  const [isAskingCode, setIsAskingCode] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  return {
    code,
    isAskingCode,
    error,
    askCode: () => {
      setIsAskingCode(true)
    },
    setCode: (value: string) => {
      setCodeValue(value)
      setError(undefined)
    },
    /** Si se pidió el código y falta: lo avisa en el campo y el envío no sale. */
    isMissing: (): boolean => {
      const isMissing = isAskingCode && code === ''
      if (isMissing) setError(MISSING_CODE)
      return isMissing
    },
  }
}
