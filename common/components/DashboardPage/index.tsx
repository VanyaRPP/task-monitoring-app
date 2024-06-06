import DashboardHeader from '../DashboardHeader'
import PaymentsChart from './blocks/PaymentsChart/paymentsChart'
import PaymentsBlock from './blocks/payments'
import ServicesBlock from './blocks/services'
import CompaniesAreaChart from './blocks/сompaniesAreaChart'
import s from './style.module.scss'

const Dashboard: React.FC = () => {
  return (
    <>
      <DashboardHeader />
      <div className={s.DashboardGrid}>
        <div className={s.GridItem}>
          <CompaniesAreaChart />
        </div>
        <div className={s.GridItem}>
          <PaymentsChart />
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
