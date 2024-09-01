import DomainSelector from '@components/DomainSelector'
import { Typography } from 'antd'
import s from './style.module.scss'

const { Text } = Typography

interface Props {
  setDomainId: (domainId: string) => void
}

const CompaniesAreaChartHeader: React.FC<Props> = ({ setDomainId }) => {
  return (
    <div className={s.chartBlock} style={{ gap: 8 }}>
      <Text>Займані площі</Text>
      <div style={{ width: 200 }}>
        <DomainSelector onSelect={(domainId) => setDomainId(domainId)} />
      </div>
    </div>
  )
}

export default CompaniesAreaChartHeader
