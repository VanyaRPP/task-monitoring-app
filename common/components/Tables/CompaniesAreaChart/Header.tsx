import DomainSelector from '@common/components/DomainSelector'
import { IDomain } from '@common/modules/models/Domain'
import { Typography } from 'antd'
import s from './style.module.scss'

const { Text } = Typography

interface Props {
  setDomainId: (domainId: string) => void
  domains: IDomain[]
}

const CompaniesAreaChartHeader: React.FC<Props> = ({
  setDomainId,
  domains,
}) => {
  return (
    <div className={s.chartBlock}>
      <Text>Займані площі</Text>
      <DomainSelector domains={domains} setDomainId={setDomainId} />
    </div>
  )
}

export default CompaniesAreaChartHeader
