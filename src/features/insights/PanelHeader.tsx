import type { ReactNode } from 'react'

import PageHeader from '../../components/PageHeader'
import PanelTabs from './PanelTabs'

interface PanelHeaderProps {
  readonly description: ReactNode
  readonly actions?: ReactNode
}

/** El título común del panel y el cambio entre sus secciones. */
export default function PanelHeader({ description, actions }: PanelHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Panel BI" description={description} actions={actions} />
      <PanelTabs />
    </div>
  )
}
