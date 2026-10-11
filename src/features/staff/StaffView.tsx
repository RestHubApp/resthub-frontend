import { useState } from 'react'

import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { StaffCreateDialog } from './StaffCreateDialog'
import { StaffTeamCard } from './StaffTeamCard'

/** Las cuentas del restaurante, cada una con su rol. */
export function StaffView() {
  const [isCreating, setIsCreating] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Personal"
        description="Quién puede entrar a RestHub, con qué rol y si está activa."
        actions={
          <Button
            type="button"
            size="lg"
            className="h-10 px-4"
            onClick={() => {
              setIsCreating(true)
            }}
          >
            <Icon name="add" size={16} />
            <span>Nueva cuenta</span>
          </Button>
        }
      />

      <StaffCreateDialog open={isCreating} onOpenChange={setIsCreating} />

      <StaffTeamCard />
    </div>
  )
}
