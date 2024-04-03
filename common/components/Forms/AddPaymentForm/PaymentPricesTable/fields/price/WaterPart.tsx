import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '../..'
import { Price } from '../../fields/price'

const WaterPart: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { company, service } = usePaymentContext()

  if (company?.waterPart) {
    return (
      <Price
        record={record}
        edit={edit}
        initialValue={(company.waterPart / 100) * service?.waterPriceTotal}
      />
    )
  }

  return <Price record={record} edit={edit} />
}

export default WaterPart
