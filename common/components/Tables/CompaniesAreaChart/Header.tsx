import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import DomainSelector from '@components/DomainSelector'
import { Typography } from 'antd'
import s from './style.module.scss'

const { Text } = Typography

interface Props {
  setDomainId: (domainId: string) => void
  domains: IExtendedDomain[]
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
