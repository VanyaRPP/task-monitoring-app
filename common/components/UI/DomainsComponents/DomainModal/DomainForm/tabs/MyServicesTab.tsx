import ServicesSelect from '@components/UI/Reusable/ServicesSelect'
import { FC } from 'react'
import AreaCalculationCard from '../DomainAreaCalc'
import DomainsServices from '../DomainsServices'
import type { TabProps } from './types'

const MyServicesTab: FC<TabProps> = ({
  form,
  editable,
  domainId,
  setIsValueChanged,
}) => (
  <>
    <ServicesSelect form={form} disabled={!editable} domainId={domainId} />
    <DomainsServices
      form={form}
      editable={editable}
      domainId={domainId}
      renderSnapshotsList={false}
    />
    <AreaCalculationCard
      domainId={domainId}
      editable={editable}
      form={form}
      setIsValueChanged={setIsValueChanged}
    />
  </>
)

export default MyServicesTab
