import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { parseStringToFloat } from '@utils/helpers'

const WaterPart: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  const { company, service } = usePaymentContext()

  if (company?.waterPart && service?.waterPriceTotal) {
    return (
      <>
        {parseStringToFloat(company.waterPart)}% від{' '}
        {parseStringToFloat(service.waterPriceTotal)}
      </>
    )
  }
}

export default WaterPart
