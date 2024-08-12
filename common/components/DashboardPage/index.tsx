import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Roles } from '@utils/constants'
import { Space } from 'antd'
import DomainsBlock from './blocks/domains'
import PaymentsBlock from './blocks/payments'
import PaymentsChart from './blocks/PaymentsChart/paymentsChart'
import RealEstateBlock from './blocks/realEstates'
import ServicesBlock from './blocks/services'
import StreetsBlock from './blocks/streets'
import CompaniesAreaChart from './blocks/сompaniesAreaChart'

const Dashboard: React.FC = () => {
  const { data: userResponse } = useGetCurrentUserQuery()
  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <CompaniesAreaChart />
      <PaymentsChart />
      {isGlobalAdmin && <StreetsBlock />}
      <DomainsBlock />
      <RealEstateBlock />
      <ServicesBlock />
      <PaymentsBlock />
    </Space>
  )
}

export default Dashboard
