import CardSwap, { Card } from "@components/CardSwap/CardSwap/CardSwap" 
import PaymentsChart from '@components/DashboardPage/blocks/paymentChart'
import ProfitPage from '@components/Pages/ProfiitPage' 
import DomainsBlock from '@components/DashboardPage/blocks/domains'
import PaymentsBlock from '@components/DashboardPage/blocks/payments'
import RealEstateBlock from '@components/DashboardPage/blocks/realEstates'
import ServicesBlock from '@components/DashboardPage/blocks/services'
import StreetsBlock from '@components/DashboardPage/blocks/streets'
import CompaniesAreaChart from '@components/DashboardPage/blocks/сompaniesAreaChart'

const CardPage: React.FC = () => {
    return (
      <div>
        <CardSwap
          cardDistance={60}
          verticalDistance={70}
          delay={3000}
          pauseOnHover={false}
        >
          <Card>
            <PaymentsBlock />
          </Card>
          <Card>
            <PaymentsChart />
          </Card>
          <Card>
            <ServicesBlock />
          </Card>
        </CardSwap>
      </div>
    )
}

export default CardPage
 









