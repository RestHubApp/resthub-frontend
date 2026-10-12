import { Link } from 'react-router'

import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'

/** El acceso a «Apariencia» desde el perfil: el tema, la letra y el menú son de cada cuenta. */
export function AppearanceLink() {
  return (
    <SectionCard title="Apariencia" description="El tema de colores, la letra, el tamaño del texto y el orden del menú.">
      <div>
        <Button asChild variant="outline">
          <Link to={paths.appearance}>Cambiar la apariencia</Link>
        </Button>
      </div>
    </SectionCard>
  )
}
