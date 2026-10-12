import { useState } from 'react'

import { EmptyState } from '@/components/EmptyState'
import { FormDialog } from '@/components/FormDialog'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useScreenAction } from '@/hooks/useScreenAction'
import { OpenCashForm } from './OpenCashForm'

/**
 * Con la caja cerrada: un solo botón, «Abrir caja», que abre el formulario
 * en una ventana (dos campos, una tarea corta).
 *
 * También se abre desde la dirección (`?accion=abrir-caja`).
 */
export function CashClosedPrompt() {
  const [isOpen, setIsOpen] = useState(false)
  const request = useScreenAction('abrir-caja')

  return (
    <>
      <EmptyState title="La caja está cerrada" description="Sin caja abierta, nadie puede cobrar.">
        <Button
          type="button"
          className="px-5"
          onClick={() => {
            setIsOpen(true)
          }}
        >
          <Icon name="cashRegister" size={18} />
          <span>Abrir caja</span>
        </Button>
      </EmptyState>
      <FormDialog
        open={isOpen || request.isRequested}
        onOpenChange={(isNowOpen) => {
          setIsOpen(isNowOpen)
          if (!isNowOpen) {
            request.clear()
          }
        }}
        title="Abrir caja"
        description="Cuenta el efectivo que hay en el cajón y anótalo. Con eso empieza el turno."
      >
        <OpenCashForm />
      </FormDialog>
    </>
  )
}
