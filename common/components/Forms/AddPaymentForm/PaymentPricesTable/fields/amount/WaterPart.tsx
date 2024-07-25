import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@components/AddPaymentModal'
import { toRoundFixed } from '@utils/helpers'

const WaterPart: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  const { company, service } = usePaymentContext()

  if (company?.waterPart && service?.waterPriceTotal) {
    return (
      <>
        {toRoundFixed(company.waterPart)}% від{' '}
        {toRoundFixed(service.waterPriceTotal)}
      </>
    )
  }
}

export default WaterPart
