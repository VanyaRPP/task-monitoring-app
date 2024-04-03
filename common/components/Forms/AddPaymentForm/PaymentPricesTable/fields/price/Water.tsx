import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '../..'
import { Price } from '../../fields/price'

const Water: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { service } = usePaymentContext()

  return (
    <Price record={record} edit={edit} initialValue={service?.waterPrice} />
  )
}

export default Water
