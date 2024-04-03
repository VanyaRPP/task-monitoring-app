import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '../..'
import { Price } from '../../fields/price'

const Electricity: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { service } = usePaymentContext()

  return (
    <Price
      record={record}
      edit={edit}
      initialValue={+service?.electricityPrice}
    />
  )
}

export default Electricity
