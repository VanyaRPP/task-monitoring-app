import DashboardHeader from '../DashboardHeader'
import PaymentsBlock from './blocks/payments'
import ServicesBlock from './blocks/services'
import CompaniesAreaChart from './blocks/сompaniesAreaChart'
import s from './style.module.scss'
import RealEstateBlock from './blocks/realEstates'
import DomainsBlock from './blocks/domains'
import { Roles } from '@utils/constants'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import StreetsBlock from './blocks/streets'

const Dashboard: React.FC = () => {
  const { data: userResponse } = useGetCurrentUserQuery()
  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)

  return (
    <>
      <DashboardHeader />
      <div className={s.DashboardGrid}>
        <div className={s.GridItem}>
          <CompaniesAreaChart />
        </div>
        {isGlobalAdmin && (
          <>
            <div className={s.GridItem}>
              <StreetsBlock />
            </div>
            <div className={s.GridItem}>
              <DomainsBlock />
            </div>
          </>
        )}
        <div className={s.GridItem}>
          <RealEstateBlock />
        </div>
        <div className={s.GridItem}>
          <ServicesBlock />
        </div>
        <div className={s.GridItem}>
          <PaymentsBlock />
        </div>
      </div>
    </>
  )
}

export default Dashboard
