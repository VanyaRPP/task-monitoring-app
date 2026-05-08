import { FC } from 'react'
import type { FormInstance } from 'antd'
import DomainSnapshotsList from '../DomainsServices/DomainSnapshotsList'

interface Props {
  form: FormInstance<any>
  domainId?: string
}

const HistoryTab: FC<Props> = ({ form, domainId }) => {
  const handleRestored = (snap: {
    groups: { groupName: string; services: string[] }[]
    templateId?: string | null
  }) => {
    form.setFieldsValue({
      customServices: snap.groups.map((g) => ({
        groupName: g.groupName,
        services: (g.services ?? []).map(String),
      })),
      domainTypeTemplateId: snap.templateId ?? null,
    })
  }

  return <DomainSnapshotsList domainId={domainId} onRestored={handleRestored} />
}

export default HistoryTab
