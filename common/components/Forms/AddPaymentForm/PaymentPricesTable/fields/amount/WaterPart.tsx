import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@common/components/AddPaymentModal'

const WaterPart: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  const { company, service } = usePaymentContext()

  if (company?.waterPart && service?.waterPriceTotal) {
    return (
      <>
        {company.waterPart.toRoundFixed()}% від{' '}
        {service.waterPriceTotal.toRoundFixed()}
      </>
    )
  }
}

export default WaterPart
