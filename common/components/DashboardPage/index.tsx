import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Roles } from '@utils/constants'
import DomainsBlock from './blocks/domains'
import PaymentsBlock from './blocks/payments'
import PaymentsChart from './blocks/PaymentsChart/paymentsChart'
import RealEstateBlock from './blocks/realEstates'
import ServicesBlock from './blocks/services'
import StreetsBlock from './blocks/streets'
import CompaniesAreaChart from './blocks/сompaniesAreaChart'
import s from './style.module.scss'

const Dashboard: React.FC = () => {
  const { data: userResponse } = useGetCurrentUserQuery()
  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)

  return (
    <>
      {/* <DashboardHeader /> */}
      <div className={s.DashboardGrid}>
        <div className={s.GridItem}>
          <CompaniesAreaChart />
        </div>
        <div className={s.GridItem}>
          <PaymentsChart />
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
