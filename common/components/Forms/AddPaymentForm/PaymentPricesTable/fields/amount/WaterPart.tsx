import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '../..'

const WaterPart: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  const { company, service } = usePaymentContext()

  if (company?.waterPart && service?.waterPriceTotal) {
    return (
      <>
        {company.waterPart}% від {service.waterPriceTotal}
      </>
    )
  }
}

export default WaterPart
