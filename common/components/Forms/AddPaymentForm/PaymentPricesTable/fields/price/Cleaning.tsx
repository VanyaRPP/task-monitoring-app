import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '../..'
import { Price } from '../../fields/price'

const Cleaning: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { company } = usePaymentContext()

  if (company?.cleaning) {
    return (
      <Price record={record} edit={edit} initialValue={+company.cleaning} />
    )
  }

  return <Price record={record} edit={edit} />
}

export default Cleaning
