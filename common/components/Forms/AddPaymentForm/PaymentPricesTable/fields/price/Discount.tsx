import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '../..'
import { Price } from '../../fields/price'

const Discount: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { company } = usePaymentContext()

  if (company?.discount) {
    return (
      <Price record={record} edit={edit} initialValue={+company.discount} />
    )
  }

  return <Price record={record} edit={edit} />
}

export default Discount
