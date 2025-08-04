import CardSwap, { Card } from "@components/CardSwapper/Card"; 
import PaymentsChart from '@components/DashboardPage/blocks/paymentChart'
import PaymentsBlock from '@components/DashboardPage/blocks/payments'
import ServicesBlock from '@components/DashboardPage/blocks/services'

const CardPage: React.FC = () => {
    return (
      <div>
        <CardSwap
          cardDistance={30}
          verticalDistance={50}
          delay={3000}
          pauseOnHover={false}
        >
          <Card>
            <img
              src="/screenshots/landing1.jpg"
              alt="Payments Block"
              style={{ width: '100%', height: '100%' }}
            />
          </Card>
          <Card>
            <img
              src="/screenshots/landing2.jpg"
              alt="Payments Block"
              style={{ width: '100%', height: '100%' }}
            />
          </Card>
          <Card>
            <img
              src="/screenshots/landing3.jpg"
              alt="Payments Block"
              style={{ width: '100%', height: '100%' }}
            />
          </Card>
        </CardSwap>
      </div>
    )
}

export default CardPage