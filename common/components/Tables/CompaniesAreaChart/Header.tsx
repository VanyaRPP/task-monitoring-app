import { Select, Typography } from 'antd';
import s from './style.module.scss'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types';
import DomainSelector from '@common/components/DomainSelector';

const { Text } = Typography;

interface Props {
  setDomainId: (domainId: string) => void
}

const CompaniesAreaChartHeader: React.FC<Props> = ({ setDomainId }) =>{
  return(
    <div className={s.chartBlock}>
      <Text>
        Займані площі
      </Text>
      <DomainSelector setDomainId={setDomainId} />
    </div>
  )
}

export default CompaniesAreaChartHeader