import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '../..'
import { Amount } from '../../fields/amount'

const WaterPart: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { company, service } = usePaymentContext()

  if (company?.waterPart) {
    return (
      <>
        {company.waterPart}% від {service?.waterPriceTotal}
      </>
    )
  }

  return <Amount record={record} edit={edit} />
}

export default WaterPart
